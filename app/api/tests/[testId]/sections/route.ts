import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{ testId: string }>
}

// POST /api/tests/[testId]/sections — add a section to a test
export async function POST(request: Request, { params }: RouteParams) {
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

  // Find the next order_num
  const { count } = await supabase
    .from('sections')
    .select('id', { count: 'exact', head: true })
    .eq('test_id', testId)

  const body = await request.json()
  const { title, instructions, passage_html } = body

  const { data: section, error } = await supabase
    .from('sections')
    .insert({
      test_id: testId,
      order_num: (count ?? 0) + 1,
      title: title || `Section ${(count ?? 0) + 1}`,
      instructions: instructions || null,
      passage_html: passage_html || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Attach an empty questions array so the UI doesn't need to handle undefined
  return NextResponse.json({ section: { ...section, questions: [] } })
}
