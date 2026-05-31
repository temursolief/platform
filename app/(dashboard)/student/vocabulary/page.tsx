import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { VocabularyClient } from './VocabularyClient'
import type { VocabularyEntry } from '@/lib/types'

const CardsIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>
  </svg>
)
const ArrowRightIcon = () => (
  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6"/>
  </svg>
)

export default async function VocabularyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date().toISOString().split('T')[0]

  const { data } = await supabase
    .from('vocabulary_entries')
    .select('*, review:flashcard_reviews(*)')
    .eq('student_id', user.id)
    .order('created_at', { ascending: false })

  type RawEntry = Omit<VocabularyEntry, 'review'> & { review: VocabularyEntry['review'][] | null }
  const raw = (data ?? []) as RawEntry[]

  const entries: VocabularyEntry[] = raw.map((e) => ({
    ...e,
    review: Array.isArray(e.review) ? e.review[0] ?? undefined : e.review ?? undefined,
  }))

  const dueCount = entries.filter((e) => e.review && e.review.due_date <= today).length

  // Count passage collections the student has access to
  const { data: attempts } = await supabase
    .from('attempts')
    .select('test_id')
    .eq('student_id', user.id)

  const practicedTestIds = [...new Set((attempts ?? []).map((a: { test_id: string }) => a.test_id))]

  let passageCollectionCount = 0
  let passageDueCount = 0

  if (practicedTestIds.length > 0) {
    const { data: cols } = await supabase
      .from('passage_flashcard_collections')
      .select('id, sections!inner(test_id)')
      .in('sections.test_id', practicedTestIds)

    passageCollectionCount = cols?.length ?? 0

    if (passageCollectionCount > 0) {
      const collectionIds = (cols ?? []).map((c: { id: string }) => c.id)
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
      passageDueCount = (items ?? []).filter((i: { id: string }) => {
        const p = progressMap.get(i.id) as { due_date: string } | undefined
        return !p || p.due_date <= today
      }).length
    }
  }

  return (
    <div className="py-8 px-10 max-w-[900px]">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-4xl font-bold leading-none" style={{ color: 'var(--ink)', fontFamily: 'Georgia, serif' }}>
          Vocabulary
        </h1>
        <p className="text-sm mt-2" style={{ color: 'var(--ink-muted)' }}>
          Anki-style spaced repetition — words you save are scheduled for optimal review.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-8 p-1 rounded-2xl w-fit" style={{ background: 'var(--surface-2)' }}>
        <span
          className="px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: 'var(--ink)', color: 'white' }}
        >
          My Words
        </span>
        <Link
          href="/student/vocabulary/passages"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors hover:bg-[var(--surface)]"
          style={{ color: 'var(--ink-soft)' }}
        >
          <CardsIcon />
          Passage Flashcards
          {passageCollectionCount > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-0.5"
                  style={{ background: passageDueCount > 0 ? 'var(--primary-soft)' : 'var(--surface)', color: passageDueCount > 0 ? 'var(--primary)' : 'var(--ink-muted)' }}>
              {passageDueCount > 0 ? `${passageDueCount} due` : passageCollectionCount}
            </span>
          )}
        </Link>
      </div>

      {/* Passage flashcard teaser (if any exist) */}
      {passageCollectionCount > 0 && passageDueCount > 0 && (
        <div
          className="rounded-2xl px-5 py-4 mb-6 flex items-center justify-between"
          style={{ background: 'var(--surface)', border: '1.5px solid var(--line)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
              <CardsIcon />
            </div>
            <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
              {passageDueCount} passage flashcard{passageDueCount !== 1 ? 's' : ''} due
            </p>
          </div>
          <Link
            href="/student/vocabulary/passages"
            className="flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-70"
            style={{ color: 'var(--primary)' }}
          >
            View <ArrowRightIcon />
          </Link>
        </div>
      )}

      <VocabularyClient initialEntries={entries} dueCount={dueCount} />
    </div>
  )
}
