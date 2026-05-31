import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/vocabulary/passage-collections/review
// Returns all passage flashcard items due today across all accessible collections
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = new Date().toISOString().split('T')[0]

  // 1. Practiced test IDs
  const { data: attempts } = await supabase
    .from('attempts')
    .select('test_id')
    .eq('student_id', user.id)

  const practicedTestIds = [...new Set((attempts ?? []).map((a) => a.test_id))]
  if (practicedTestIds.length === 0) return NextResponse.json({ items: [] })

  // 2. Collections for practiced tests
  const { data: collections } = await supabase
    .from('passage_flashcard_collections')
    .select('id, title, sections!inner(test_id)')
    .in('sections.test_id', practicedTestIds)

  if (!collections?.length) return NextResponse.json({ items: [] })

  const collectionIds = collections.map((c) => c.id)
  const collectionTitleMap = new Map(collections.map((c) => [c.id, c.title]))

  // 3. All items in those collections
  const { data: items, error } = await supabase
    .from('passage_flashcard_items')
    .select('*')
    .in('collection_id', collectionIds)
    .order('order_num', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!items?.length) return NextResponse.json({ items: [] })

  // 4. Student progress for those items
  const itemIds = items.map((i) => i.id)
  const { data: progress } = await supabase
    .from('passage_flashcard_progress')
    .select('*')
    .eq('student_id', user.id)
    .in('item_id', itemIds)

  const progressMap = new Map((progress ?? []).map((p) => [p.item_id, p]))

  // 5. Return items that are due or new (no progress)
  const dueItems = items
    .filter((item) => {
      const p = progressMap.get(item.id)
      return !p || p.due_date <= today
    })
    .map((item) => ({
      ...item,
      collection_title: collectionTitleMap.get(item.collection_id) ?? '',
      progress: progressMap.get(item.id) ?? null,
    }))

  return NextResponse.json({ items: dueItems })
}
