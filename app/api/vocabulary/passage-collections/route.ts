import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/vocabulary/passage-collections
// Returns all passage flashcard collections for tests the student has practiced (attempted)
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = new Date().toISOString().split('T')[0]

  // 1. Tests the student has attempted
  const { data: attempts } = await supabase
    .from('attempts')
    .select('test_id')
    .eq('student_id', user.id)

  const practicedTestIds = [...new Set((attempts ?? []).map((a) => a.test_id))]

  if (practicedTestIds.length === 0) return NextResponse.json({ collections: [] })

  // 2. Sections from those tests that have a flashcard collection
  const { data: collections, error } = await supabase
    .from('passage_flashcard_collections')
    .select(`
      id, title, section_id, teacher_id, created_at,
      section:sections!inner(id, test_id, order_num, tests!inner(id, title))
    `)
    .in('sections.test_id', practicedTestIds)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!collections?.length) return NextResponse.json({ collections: [] })

  const collectionIds = collections.map((c) => c.id)

  // 3. Item counts per collection
  const { data: items } = await supabase
    .from('passage_flashcard_items')
    .select('id, collection_id')
    .in('collection_id', collectionIds)

  // 4. Student progress for all items
  const itemIds = (items ?? []).map((i) => i.id)
  const { data: progress } = itemIds.length
    ? await supabase
        .from('passage_flashcard_progress')
        .select('item_id, due_date')
        .eq('student_id', user.id)
        .in('item_id', itemIds)
    : { data: [] }

  const progressMap = new Map((progress ?? []).map((p) => [p.item_id, p]))

  // 5. Build response with stats
  const result = collections.map((c) => {
    const secRaw = c.section as unknown
    const secArr = Array.isArray(secRaw) ? secRaw[0] : secRaw
    const sec = secArr as { id: string; test_id: string; order_num: number; tests: { id: string; title: string } | { id: string; title: string }[] } | null
    const tests = sec ? (Array.isArray(sec.tests) ? sec.tests[0] : sec.tests) as { id: string; title: string } : null
    const collItems = (items ?? []).filter((i) => i.collection_id === c.id)
    const dueCount = collItems.filter((i) => {
      const p = progressMap.get(i.id)
      return !p || p.due_date <= today
    }).length

    return {
      id: c.id,
      title: c.title,
      section_id: c.section_id,
      teacher_id: c.teacher_id,
      created_at: c.created_at,
      test_id: tests?.id ?? '',
      test_title: tests?.title ?? 'Unknown Test',
      total_items: collItems.length,
      due_items: dueCount,
    }
  })

  return NextResponse.json({ collections: result })
}
