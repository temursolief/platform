import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

type Params = { params: Promise<{ collectionId: string }> }

// GET /api/vocabulary/passage-collections/[collectionId]
// Returns collection info + all items with student progress
export async function GET(_req: Request, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { collectionId } = await params
  const today = new Date().toISOString().split('T')[0]

  // 1. Collection + section + test info
  const { data: collection, error: colError } = await supabase
    .from('passage_flashcard_collections')
    .select('*, section:sections!inner(id, test_id, title, order_num, tests!inner(id, title))')
    .eq('id', collectionId)
    .single()

  if (colError || !collection) return NextResponse.json({ error: 'Collection not found.' }, { status: 404 })

  const sec = collection.section as { id: string; test_id: string; title: string; order_num: number; tests: { id: string; title: string } } | null

  // 2. Verify student practiced this test (or teacher owns it)
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const isTeacher = profile?.role === 'teacher' || profile?.role === 'admin'

  if (!isTeacher) {
    const { data: attempt } = await supabase
      .from('attempts')
      .select('id')
      .eq('student_id', user.id)
      .eq('test_id', sec?.test_id ?? '')
      .maybeSingle()

    if (!attempt) {
      return NextResponse.json({ error: 'You have not practiced this passage yet.' }, { status: 403 })
    }
  }

  // 3. Items
  const { data: items, error: itemsError } = await supabase
    .from('passage_flashcard_items')
    .select('*')
    .eq('collection_id', collectionId)
    .order('order_num', { ascending: true })

  if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 })

  // 4. Student progress
  const itemIds = (items ?? []).map((i) => i.id)
  const { data: progress } = itemIds.length
    ? await supabase
        .from('passage_flashcard_progress')
        .select('*')
        .eq('student_id', user.id)
        .in('item_id', itemIds)
    : { data: [] }

  const progressMap = new Map((progress ?? []).map((p) => [p.item_id, p]))

  const itemsWithProgress = (items ?? []).map((item) => ({
    ...item,
    progress: progressMap.get(item.id) ?? null,
  }))

  const dueCount = itemsWithProgress.filter((i) => !i.progress || i.progress.due_date <= today).length

  return NextResponse.json({
    collection: {
      id: collection.id,
      title: collection.title,
      section_id: collection.section_id,
      teacher_id: collection.teacher_id,
      created_at: collection.created_at,
      test_id: sec?.tests?.id ?? '',
      test_title: sec?.tests?.title ?? '',
    },
    items: itemsWithProgress,
    stats: { total: itemsWithProgress.length, due: dueCount },
  })
}
