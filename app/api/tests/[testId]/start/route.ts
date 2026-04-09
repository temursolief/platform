import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{ testId: string }>
}

// POST /api/tests/[testId]/start — create a new attempt
export async function POST(_request: Request, { params }: RouteParams) {
  const { testId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch test — allow the owner (teacher) even if unpublished
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const isTeacher = profile?.role === 'teacher' || profile?.role === 'admin'

  const { data: test } = await supabase
    .from('tests')
    .select('id, teacher_id, is_published, total_questions')
    .eq('id', testId)
    .single()

  if (!test) return NextResponse.json({ error: 'Test not found' }, { status: 404 })

  // Teachers can only preview their own tests; students need published tests
  const canAccess = isTeacher
    ? test.teacher_id === user.id
    : test.is_published

  if (!canAccess) {
    return NextResponse.json({ error: 'Test not available' }, { status: 404 })
  }

  // Check for existing incomplete attempt
  const { data: existingAttempt } = await supabase
    .from('attempts')
    .select('id')
    .eq('student_id', user.id)
    .eq('test_id', testId)
    .eq('is_completed', false)
    .order('started_at', { ascending: false })
    .limit(1)
    .single()

  if (existingAttempt) {
    return NextResponse.json({ attemptId: existingAttempt.id })
  }

  // Create new attempt
  const { data: attempt, error } = await supabase
    .from('attempts')
    .insert({
      student_id: user.id,
      test_id: testId,
      total_questions: test.total_questions,
      is_completed: false,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ attemptId: attempt.id })
}
