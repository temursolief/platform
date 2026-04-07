import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{ testId: string }>
}

// GET /api/tests/[testId]
export async function GET(_request: Request, { params }: RouteParams) {
  const { testId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: test, error } = await supabase
    .from('tests')
    .select('*, sections(*, questions(*, options(*)))')
    .eq('id', testId)
    .single()

  if (error || !test) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Sort sections and questions
  test.sections = (test.sections ?? [])
    .sort((a: { order_num: number }, b: { order_num: number }) => a.order_num - b.order_num)
    .map((s: { questions: { order_num: number }[] }) => ({
      ...s,
      questions: (s.questions ?? []).sort(
        (a: { order_num: number }, b: { order_num: number }) => a.order_num - b.order_num
      ),
    }))

  return NextResponse.json({ test })
}

// PUT /api/tests/[testId]
export async function PUT(request: Request, { params }: RouteParams) {
  const { testId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify ownership
  const { data: test } = await supabase
    .from('tests')
    .select('teacher_id')
    .eq('id', testId)
    .single()

  if (!test || test.teacher_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const updates = await request.json()

  const { data: updated, error } = await supabase
    .from('tests')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', testId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ test: updated })
}

// DELETE /api/tests/[testId]
export async function DELETE(_request: Request, { params }: RouteParams) {
  const { testId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: test } = await supabase
    .from('tests')
    .select('teacher_id')
    .eq('id', testId)
    .single()

  if (!test || test.teacher_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await supabase.from('tests').delete().eq('id', testId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
