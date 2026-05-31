'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import type { PassageFlashcardItem } from '@/lib/types'

// ─── Icons ───────────────────────────────────────────────────────────────────
const ArrowLeftIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M11 6l-6 6 6 6"/>
  </svg>
)
const TrophyIcon = () => (
  <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H3.5a2.5 2.5 0 0 0 0 5H6M18 9h2.5a2.5 2.5 0 0 1 0 5H18M6 9V3h12v6M6 9c0 5 3 8 6 8s6-3 6-8M12 17v4M8 21h8"/>
  </svg>
)

const RATINGS = [
  { label: 'Again', value: 0, desc: 'Completely forgot',    style: { background: 'var(--rose-soft)',    color: 'var(--rose)',    border: '1.5px solid var(--rose)'    } },
  { label: 'Hard',  value: 1, desc: 'Struggled to recall',  style: { background: 'var(--surface-2)',    color: 'var(--ink-soft)', border: '1.5px solid var(--line)'  } },
  { label: 'Good',  value: 2, desc: 'Remembered with effort',style: { background: 'var(--primary-soft)', color: 'var(--primary)', border: '1.5px solid var(--primary)'} },
  { label: 'Easy',  value: 3, desc: 'Remembered instantly', style: { background: 'var(--accent-soft)',  color: 'var(--accent)',  border: '1.5px solid var(--accent)'  } },
]

// ─── Flashcard ────────────────────────────────────────────────────────────────
function Flashcard({
  item, collectionTitle, revealed, onReveal, onRate, current, total,
}: {
  item: PassageFlashcardItem & { collection_title?: string }
  collectionTitle?: string
  revealed: boolean
  onReveal: () => void
  onRate: (rating: number) => void
  current: number
  total: number
}) {
  const label = item.collection_title ?? collectionTitle ?? ''

  return (
    <div className="flex flex-col items-center w-full max-w-[640px] mx-auto">
      {/* Progress */}
      <div className="w-full mb-6">
        <div className="flex justify-between text-xs font-semibold mb-2" style={{ color: 'var(--ink-muted)' }}>
          <span>{current} / {total}</span>
          <span>{Math.round((current / total) * 100)}%</span>
        </div>
        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
          <div className="h-full rounded-full transition-all duration-300"
               style={{ width: `${(current / total) * 100}%`, background: 'var(--primary)' }} />
        </div>
        {label && (
          <p className="text-center text-[10px] font-bold tracking-widest mt-2" style={{ color: 'var(--ink-muted)' }}>
            {label.toUpperCase()}
          </p>
        )}
      </div>

      {/* Card */}
      <div className="w-full rounded-3xl p-8 flex flex-col items-center text-center min-h-[320px] justify-center"
           style={{ background: 'var(--surface)', border: '1.5px solid var(--line)', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
        <div className="mb-2">
          <span className="text-[10px] font-bold tracking-widest" style={{ color: 'var(--ink-muted)' }}>WORD</span>
        </div>
        <h2 className="text-5xl font-bold mb-2" style={{ color: 'var(--ink)', fontFamily: 'Georgia, serif' }}>
          {item.word}
        </h2>
        {item.translation && !revealed && (
          <p className="text-base mt-1" style={{ color: 'var(--ink-muted)' }}>{item.translation}</p>
        )}

        {revealed ? (
          <div className="w-full mt-6 pt-6 space-y-4" style={{ borderTop: '1.5px solid var(--line)' }}>
            <div>
              <span className="text-[10px] font-bold tracking-widest" style={{ color: 'var(--ink-muted)' }}>DEFINITION</span>
              <p className="text-lg mt-1 leading-snug" style={{ color: 'var(--ink-soft)' }}>{item.definition}</p>
            </div>
            {item.example_sentence && (
              <div>
                <span className="text-[10px] font-bold tracking-widest" style={{ color: 'var(--ink-muted)' }}>EXAMPLE</span>
                <p className="text-base mt-1 italic" style={{ color: 'var(--ink-soft)' }}>&ldquo;{item.example_sentence}&rdquo;</p>
              </div>
            )}
            {item.translation && (
              <div>
                <span className="text-[10px] font-bold tracking-widest" style={{ color: 'var(--ink-muted)' }}>TRANSLATION</span>
                <p className="text-base mt-1 font-medium" style={{ color: 'var(--ink)' }}>{item.translation}</p>
              </div>
            )}
            {item.notes && (
              <div>
                <span className="text-[10px] font-bold tracking-widest" style={{ color: 'var(--ink-muted)' }}>NOTES</span>
                <p className="text-sm mt-1" style={{ color: 'var(--ink-muted)' }}>{item.notes}</p>
              </div>
            )}
          </div>
        ) : (
          <button onClick={onReveal}
            className="mt-8 px-8 py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ background: 'var(--ink)', color: 'white' }}>
            Show answer
          </button>
        )}
      </div>

      {/* Rating buttons */}
      {revealed && (
        <div className="w-full mt-6">
          <p className="text-center text-xs font-semibold mb-3" style={{ color: 'var(--ink-muted)' }}>How well did you remember?</p>
          <div className="grid grid-cols-4 gap-3">
            {RATINGS.map((r) => (
              <button key={r.value} onClick={() => onRate(r.value)}
                className="flex flex-col items-center py-3 px-2 rounded-2xl font-semibold transition-opacity hover:opacity-80"
                style={r.style}>
                <span className="text-sm font-bold">{r.label}</span>
                <span className="text-[10px] mt-0.5 opacity-70">{r.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {!revealed && (
        <p className="mt-4 text-xs" style={{ color: 'var(--ink-muted)' }}>
          Press <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono" style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>Space</kbd> to reveal
        </p>
      )}
    </div>
  )
}

// ─── Session complete ─────────────────────────────────────────────────────────
function SessionComplete({ reviewed, backHref, backLabel, onRestart }: {
  reviewed: number; backHref: string; backLabel: string; onRestart: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
           style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
        <TrophyIcon />
      </div>
      <h2 className="text-4xl font-bold mb-3" style={{ color: 'var(--ink)', fontFamily: 'Georgia, serif' }}>Session done!</h2>
      <p className="text-base mb-2" style={{ color: 'var(--ink-soft)' }}>
        You reviewed <strong>{reviewed}</strong> card{reviewed !== 1 ? 's' : ''}.
      </p>
      <p className="text-sm mb-8" style={{ color: 'var(--ink-muted)' }}>
        Cards rated &ldquo;Again&rdquo; or &ldquo;Hard&rdquo; are scheduled for tomorrow.
      </p>
      <div className="flex gap-3">
        <button onClick={onRestart}
          className="px-6 py-3 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'var(--primary)' }}>
          Review again
        </button>
        <Link href={backHref}
          className="px-6 py-3 rounded-xl text-sm font-semibold"
          style={{ background: 'var(--surface-2)', color: 'var(--ink-soft)' }}>
          {backLabel}
        </Link>
      </div>
    </div>
  )
}

// ─── Main review component ────────────────────────────────────────────────────
interface Props {
  fetchUrl: string
  collectionTitle?: string
  backHref: string
  backLabel: string
  backCrumbs: { label: string; href: string }[]
  /** When true, filters returned items to only those due today or new (no progress) */
  filterDue?: boolean
}

export function PassageReviewClient({ fetchUrl, collectionTitle, backHref, backLabel, backCrumbs, filterDue }: Props) {
  const [cards, setCards] = useState<(PassageFlashcardItem & { collection_title?: string })[]>([])
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [reviewed, setReviewed] = useState(0)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadCards = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(fetchUrl)
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }

      const today = new Date().toISOString().split('T')[0]
      let items: (PassageFlashcardItem & { collection_title?: string })[] = data.items ?? []
      if (filterDue) {
        items = items.filter((item) => !item.progress || item.progress.due_date <= today)
      }
      setCards(items)
      setIndex(0)
      setRevealed(false)
      setReviewed(0)
      setDone(items.length === 0)
    } catch {
      setError('Failed to load cards.')
    } finally {
      setLoading(false)
    }
  }, [fetchUrl])

  useEffect(() => { loadCards() }, [loadCards])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (done || loading) return
      if (e.code === 'Space' && !revealed) { e.preventDefault(); setRevealed(true) }
      if (revealed) {
        if (e.key === '1') handleRate(0)
        if (e.key === '2') handleRate(1)
        if (e.key === '3') handleRate(2)
        if (e.key === '4') handleRate(3)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  })

  const handleRate = async (rating: number) => {
    const card = cards[index]
    if (!card) return
    const nextIndex = index + 1
    setReviewed((r) => r + 1)
    if (nextIndex >= cards.length) setDone(true)
    else { setIndex(nextIndex); setRevealed(false) }

    fetch(`/api/vocabulary/passage-flashcard-items/${card.id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating }),
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p style={{ color: 'var(--ink-muted)' }}>Loading cards…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <p style={{ color: 'var(--rose)' }}>{error}</p>
        <Link href={backHref} className="text-sm mt-4 inline-block" style={{ color: 'var(--primary)' }}>← {backLabel}</Link>
      </div>
    )
  }

  return (
    <div>
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm mb-8 flex-wrap">
        {backCrumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-2">
            {i > 0 && <span style={{ color: 'var(--line)' }}>/</span>}
            <Link href={crumb.href} className="font-semibold transition-opacity hover:opacity-70" style={{ color: 'var(--ink-muted)' }}>
              {crumb.label}
            </Link>
          </span>
        ))}
        <span style={{ color: 'var(--line)' }}>/</span>
        <span className="font-semibold" style={{ color: 'var(--ink)' }}>Review</span>
      </div>

      {done ? (
        <SessionComplete reviewed={reviewed} backHref={backHref} backLabel={backLabel} onRestart={loadCards} />
      ) : cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <div className="mb-6" style={{ color: 'var(--ink-muted)' }}><TrophyIcon /></div>
          <h2 className="text-2xl font-bold mt-2 mb-2" style={{ color: 'var(--ink)', fontFamily: 'Georgia, serif' }}>All caught up!</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--ink-muted)' }}>No cards due right now. Check back later.</p>
          <Link href={backHref} className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>← {backLabel}</Link>
        </div>
      ) : (
        <>
          <div className="mb-6 text-center">
            <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
              {revealed
                ? <>Rate: {['1 Again', '2 Hard', '3 Good', '4 Easy'].map((k) => (
                    <span key={k}>&nbsp;<kbd className="mx-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono" style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>{k[0]}</kbd> {k.slice(2)}</span>
                  ))}</>
                : 'Think about the definition before revealing the answer'}
            </p>
          </div>
          <Flashcard
            item={cards[index]}
            collectionTitle={collectionTitle}
            revealed={revealed}
            onReveal={() => setRevealed(true)}
            onRate={handleRate}
            current={index + 1}
            total={cards.length}
          />
        </>
      )}
    </div>
  )
}
