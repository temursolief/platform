import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { scoreTest } from '@/lib/scoring/answer-checker'
import { calculateBandScore } from '@/lib/scoring/band-tables'
import type { Question } from '@/lib/types'

interface RouteParams {
  params: Promise<{ testId: string }>
}

// POST /api/tests/[testId]/submit
export async function POST(request: Request, { params }: RouteParams) {
  const { testId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { attemptId, answers } = await request.json()

  if (!attemptId || !answers) {
    return NextResponse.json({ error: 'attemptId and answers are required' }, { status: 400 })
  }

  // Verify attempt belongs to user and is not yet completed
  const { data: attempt } = await supabase
    .from('attempts')
    .select('*')
    .eq('id', attemptId)
    .eq('student_id', user.id)
    .single()

  if (!attempt) return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
  if (attempt.is_completed) return NextResponse.json({ error: 'Already submitted' }, { status: 400 })

  // Fetch test with all questions
  const { data: test } = await supabase
    .from('tests')
    .select('*, sections(*, questions(*))')
    .eq('id', testId)
    .single()

  if (!test) return NextResponse.json({ error: 'Test not found' }, { status: 404 })

  // Flatten questions
  const questions: Question[] = (test.sections ?? []).flatMap(
    (s: { questions: Question[] }) => s.questions ?? []
  )

  // Score server-side
  const { rawScore, results } = scoreTest(questions, answers)
  const tableType = test.type === 'listening' ? 'listening' : 'reading_academic'
  const bandScore = calculateBandScore(rawScore, tableType)

  // Save individual answers
  const answerRecords = Object.entries(answers as Record<string, string>).map(
    ([questionId, answer]) => ({
      attempt_id: attemptId,
      question_id: questionId,
      given_answer: answer,
      is_correct: results[questionId] ?? false,
    })
  )

  if (answerRecords.length > 0) {
    await supabase.from('answers').upsert(answerRecords, {
      onConflict: 'attempt_id,question_id',
    })
  }

  // Calculate time taken
  const timeTaken = Math.floor(
    (Date.now() - new Date(attempt.started_at).getTime()) / 1000
  )

  // Mark attempt as completed
  const { data: completedAttempt, error: updateError } = await supabase
    .from('attempts')
    .update({
      submitted_at: new Date().toISOString(),
      raw_score: rawScore,
      total_questions: questions.length,
      band_score: bandScore,
      time_taken_seconds: timeTaken,
      is_completed: true,
    })
    .eq('id', attemptId)
    .select()
    .single()

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  return NextResponse.json({
    attempt: completedAttempt,
    results,
    summary: {
      rawScore,
      totalQuestions: questions.length,
      bandScore,
      timeTaken,
    },
  })
}
