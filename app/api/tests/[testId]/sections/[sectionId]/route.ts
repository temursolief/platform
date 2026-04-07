import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{ testId: string; sectionId: string }>
}

// PATCH /api/tests/[testId]/sections/[sectionId]
export async function PATCH(request: Request, { params }: RouteParams) {
  const { testId, sectionId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify teacher owns the test
  const { data: test } = await supabase
    .from('tests')
    .select('teacher_id')
    .eq('id', testId)
    .single()

  if (!test || test.teacher_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const updates = await request.json()

  const { data: section, error } = await supabase
    .from('sections')
    .update(updates)
    .eq('id', sectionId)
    .eq('test_id', testId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ section })
}
