import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{ testId: string }>
}

// POST /api/tests/[testId]/questions — add a question to a section
export async function POST(request: Request, { params }: RouteParams) {
  const { testId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fold ownership verification into a single query — no pre-fetch needed
  const { data: test } = await supabase
    .from('tests')
    .select('teacher_id')
    .eq('id', testId)
    .eq('teacher_id', user.id)
    .single()

  if (!test) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const {
    section_id,
    order_num,
    type,
    question_text,
    correct_answer,
    acceptable_answers,
    hint,
    options = [],
  } = body

  if (!section_id || !type || !question_text || !correct_answer) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data: question, error } = await supabase
    .from('questions')
    .insert({
      section_id,
      order_num: order_num ?? 1,
      type,
      question_text,
      correct_answer: String(correct_answer),
      acceptable_answers: acceptable_answers
        ? String(acceptable_answers).split(',').map((s: string) => s.trim()).filter(Boolean)
        : null,
      hint: hint || null,
      points: 1,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Insert options for MC questions
  if (options.length > 0 && question) {
    const optRecords = options.map((opt: { label: string; text: string; is_correct: boolean }) => ({
      question_id: question.id,
      label: opt.label,
      option_text: opt.text,
      is_correct: opt.is_correct ?? false,
    }))
    const { data: insertedOpts } = await supabase
      .from('options')
      .insert(optRecords)
      .select()

    question.options = insertedOpts ?? []
  }

  // total_questions is maintained automatically by the trg_sync_total_questions trigger

  return NextResponse.json({ question })
}
