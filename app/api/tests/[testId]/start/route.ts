import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{ testId: string }>
}

// POST /api/tests/[testId]/start — create or resume an attempt
export async function POST(_request: Request, { params }: RouteParams) {
  const { testId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch role and test in parallel — they are independent of each other
  const [{ data: profile }, { data: test }] = await Promise.all([
    supabase.from('users').select('role').eq('id', user.id).single(),
    supabase
      .from('tests')
      .select('id, teacher_id, is_published, total_questions')
      .eq('id', testId)
      .single(),
  ])

  if (!test) return NextResponse.json({ error: 'Test not found' }, { status: 404 })

  const isTeacher = profile?.role === 'teacher' || profile?.role === 'admin'
  const canAccess = isTeacher ? test.teacher_id === user.id : test.is_published
  if (!canAccess) return NextResponse.json({ error: 'Test not available' }, { status: 404 })

  // Check for an existing incomplete attempt
  const { data: existingAttempt } = await supabase
    .from('attempts')
    .select('id')
    .eq('student_id', user.id)
    .eq('test_id', testId)
    .eq('is_completed', false)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existingAttempt) {
    // Reset started_at so time_taken_seconds reflects this session, not a stale one
    await supabase
      .from('attempts')
      .update({ started_at: new Date().toISOString() })
      .eq('id', existingAttempt.id)
    return NextResponse.json({ attemptId: existingAttempt.id })
  }

  const { data: attempt, error } = await supabase
    .from('attempts')
    .insert({
      student_id: user.id,
      test_id: testId,
      total_questions: test.total_questions,
      started_at: new Date().toISOString(),
      is_completed: false,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ attemptId: attempt.id })
}
