import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const CardsIcon = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>
  </svg>
)
const ArrowRightIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6"/>
  </svg>
)
const BookIcon = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2V5Z"/><path d="M4 19a2 2 0 0 1 2-2h12"/>
  </svg>
)

export default async function PassageFlashcardsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date().toISOString().split('T')[0]

  // Practiced test IDs
  const { data: attempts } = await supabase
    .from('attempts')
    .select('test_id')
    .eq('student_id', user.id)

  const practicedTestIds = [...new Set((attempts ?? []).map((a: { test_id: string }) => a.test_id))]

  type CollectionRow = {
    id: string; title: string; section_id: string; created_at: string
    section: unknown
  }

  let collections: CollectionRow[] = []
  let allDueCount = 0

  if (practicedTestIds.length > 0) {
    const { data: cols } = await supabase
      .from('passage_flashcard_collections')
      .select('id, title, section_id, created_at, section:sections!inner(test_id, tests!inner(id, title))')
      .in('sections.test_id', practicedTestIds)

    collections = (cols ?? []) as CollectionRow[]

    if (collections.length > 0) {
      const collectionIds = collections.map((c) => c.id)

      const { data: items } = await supabase
        .from('passage_flashcard_items')
        .select('id, collection_id')
        .in('collection_id', collectionIds)

      const itemIds = (items ?? []).map((i: { id: string }) => i.id)

      const { data: progress } = itemIds.length
        ? await supabase
            .from('passage_flashcard_progress')
            .select('item_id, due_date')
            .eq('student_id', user.id)
            .in('item_id', itemIds)
        : { data: [] }

      const progressMap = new Map((progress ?? []).map((p: { item_id: string; due_date: string }) => [p.item_id, p]))
      const itemsByCollection = new Map<string, { id: string; collection_id: string }[]>()
      for (const item of (items ?? [])) {
        const arr = itemsByCollection.get(item.collection_id) ?? []
        arr.push(item)
        itemsByCollection.set(item.collection_id, arr)
      }

      // Attach stats to each collection
      ;(collections as (CollectionRow & { total_items?: number; due_items?: number })[]).forEach((c) => {
        const collItems = itemsByCollection.get(c.id) ?? []
        const due = collItems.filter((i) => {
          const p = progressMap.get(i.id)
          return !p || (p as { due_date: string }).due_date <= today
        }).length
        c.total_items = collItems.length
        c.due_items = due
        allDueCount += due
      })
    }
  }

  type CollectionWithStats = CollectionRow & { total_items: number; due_items: number }
  const collectionsWithStats = collections as CollectionWithStats[]

  // Group by test
  const byTest = new Map<string, { testTitle: string; items: CollectionWithStats[] }>()
  for (const c of collectionsWithStats) {
    const secRaw = c.section as unknown
    const sec = (Array.isArray(secRaw) ? secRaw[0] : secRaw) as { test_id: string; tests: { id: string; title: string } | { id: string; title: string }[] } | null
    const testsRaw = sec?.tests
    const tests = testsRaw ? (Array.isArray(testsRaw) ? testsRaw[0] : testsRaw) as { id: string; title: string } : null
    const testId = tests?.id ?? 'unknown'
    const testTitle = tests?.title ?? 'Unknown Test'
    if (!byTest.has(testId)) byTest.set(testId, { testTitle, items: [] })
    byTest.get(testId)!.items.push(c)
  }

  return (
    <div className="py-8 px-10 max-w-[900px]">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm mb-4">
          <Link href="/student/vocabulary" className="font-semibold transition-opacity hover:opacity-70" style={{ color: 'var(--ink-muted)' }}>
            Vocabulary
          </Link>
          <span style={{ color: 'var(--line)' }}>/</span>
          <span className="font-semibold" style={{ color: 'var(--ink)' }}>Passage Flashcards</span>
        </div>
        <h1 className="text-4xl font-bold leading-none" style={{ color: 'var(--ink)', fontFamily: 'Georgia, serif' }}>
          Passage Flashcards
        </h1>
        <p className="text-sm mt-2" style={{ color: 'var(--ink-muted)' }}>
          Vocabulary collections attached by your teacher to passages you have practiced.
        </p>
      </div>

      {/* Review all CTA */}
      {allDueCount > 0 && (
        <div
          className="rounded-2xl p-5 mb-6 flex items-center justify-between"
          style={{ background: 'var(--primary-soft)', border: '1.5px solid var(--primary)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--primary)', color: 'white' }}>
              <CardsIcon />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--ink)' }}>
                {allDueCount} card{allDueCount !== 1 ? 's' : ''} due across all passages
              </p>
              <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>Review everything at once</p>
            </div>
          </div>
          <Link
            href="/student/vocabulary/passages/review"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'var(--primary)' }}
          >
            Review all due
          </Link>
        </div>
      )}

      {/* Empty state */}
      {collectionsWithStats.length === 0 ? (
        <div className="rounded-2xl p-16 text-center" style={{ background: 'var(--surface)', border: '1.5px solid var(--line)' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
               style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
            <BookIcon />
          </div>
          <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--ink)', fontFamily: 'Georgia, serif' }}>
            No passage flashcards yet
          </h3>
          <p className="text-sm mb-6" style={{ color: 'var(--ink-muted)' }}>
            Your teacher will attach vocabulary collections to passages as you practice them.
          </p>
          <Link
            href="/student/tests"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'var(--primary)' }}
          >
            Browse Tests
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {[...byTest.entries()].map(([testId, group]) => (
            <div key={testId}>
              {/* Test heading */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                     style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
                  <BookIcon />
                </div>
                <h2 className="text-lg font-bold" style={{ color: 'var(--ink)', fontFamily: 'Georgia, serif' }}>
                  {group.testTitle}
                </h2>
              </div>

              {/* Collections for this test */}
              <div className="space-y-3">
                {group.items.map((col) => (
                  <div
                    key={col.id}
                    className="rounded-2xl p-5 flex items-center justify-between gap-4"
                    style={{ background: 'var(--surface)', border: '1.5px solid var(--line)' }}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                           style={{ background: col.due_items > 0 ? 'var(--primary-soft)' : 'var(--surface-2)', color: col.due_items > 0 ? 'var(--primary)' : 'var(--ink-muted)' }}>
                        <CardsIcon />
                      </div>
                      <div>
                        <p className="text-base font-bold" style={{ color: 'var(--ink)', fontFamily: 'Georgia, serif' }}>
                          {col.title}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs font-medium" style={{ color: 'var(--ink-muted)' }}>
                            {col.total_items} word{col.total_items !== 1 ? 's' : ''}
                          </span>
                          {col.due_items > 0 && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
                              {col.due_items} due
                            </span>
                          )}
                          {col.due_items === 0 && col.total_items > 0 && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--surface-2)', color: 'var(--ink-muted)' }}>
                              All done
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {col.total_items > 0 && (
                      <Link
                        href={`/student/vocabulary/passages/${col.id}/review`}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold shrink-0 transition-opacity hover:opacity-80"
                        style={{
                          background: col.due_items > 0 ? 'var(--primary)' : 'var(--surface-2)',
                          color: col.due_items > 0 ? 'white' : 'var(--ink-soft)',
                        }}
                      >
                        Study <ArrowRightIcon />
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
