import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/tests — list published tests (students) or own tests (teachers)
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const isTeacher = profile?.role === 'teacher' || profile?.role === 'admin'

  let query = supabase
    .from('tests')
    .select('id, title, type, difficulty, time_limit_minutes, total_questions, is_published, created_at')
    .order('created_at', { ascending: false })

  if (isTeacher) {
    query = query.eq('teacher_id', user.id) as typeof query
  } else {
    query = query.eq('is_published', true) as typeof query
  }

  const { data: tests, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tests })
}

// POST /api/tests — create a new test (teachers only)
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'student') {
    return NextResponse.json({ error: 'Teachers only' }, { status: 403 })
  }

  const body = await request.json()
  const { title, type, difficulty, time_limit_minutes, sections = [], manual = false } = body

  if (!title || !type) {
    return NextResponse.json({ error: 'title and type are required' }, { status: 400 })
  }

  // Count total questions
  const totalQuestions = sections.reduce(
    (acc: number, s: { questions?: unknown[] }) => acc + (s.questions?.length ?? 0),
    0
  )

  // Create test
  const { data: test, error: testError } = await supabase
    .from('tests')
    .insert({
      teacher_id: user.id,
      title,
      type,
      difficulty: difficulty ?? 'intermediate',
      time_limit_minutes: time_limit_minutes ?? 60,
      total_questions: totalQuestions || 40,
      is_published: false,
    })
    .select()
    .single()

  if (testError) return NextResponse.json({ error: testError.message }, { status: 500 })

  // If manual, return early (no sections yet)
  if (manual || sections.length === 0) {
    return NextResponse.json({ test })
  }

  // Insert sections + questions
  for (let si = 0; si < sections.length; si++) {
    const sec = sections[si]

    const { data: section, error: secError } = await supabase
      .from('sections')
      .insert({
        test_id: test.id,
        order_num: si + 1,
        title: sec.title ?? `Section ${si + 1}`,
        instructions: sec.instructions ?? null,
        passage_html: sec.passage_html ?? null,
      })
      .select()
      .single()

    if (secError) continue

    const questions = sec.questions ?? []
    for (let qi = 0; qi < questions.length; qi++) {
      const q = questions[qi]
      const optionLabels = ['A', 'B', 'C', 'D']

      const { data: question } = await supabase
        .from('questions')
        .insert({
          section_id: section.id,
          order_num: q.number ?? qi + 1,
          type: q.type ?? 'fill_blank',
          question_text: q.question_text ?? q.questionText ?? '',
          correct_answer: String(q.correct_answer ?? q.answer ?? ''),
          acceptable_answers: q.acceptable_answers ?? null,
          hint: q.hint ?? null,
          points: 1,
        })
        .select()
        .single()

      // Insert options for multiple choice
      if (question && (q.type === 'multiple_choice' || q.options)) {
        const opts = q.options ?? []
        const correctLabel = String(q.correct_answer ?? '')
        for (let oi = 0; oi < opts.length; oi++) {
          const label = optionLabels[oi] ?? String.fromCharCode(65 + oi)
          await supabase.from('options').insert({
            question_id: question.id,
            label,
            option_text: String(opts[oi]),
            is_correct: label === correctLabel,
          })
        }
      }
    }
  }

  // Re-fetch complete test
  const { data: fullTest } = await supabase
    .from('tests')
    .select('*, sections(*, questions(*, options(*)))')
    .eq('id', test.id)
    .single()

  return NextResponse.json({ test: fullTest ?? test })
}
