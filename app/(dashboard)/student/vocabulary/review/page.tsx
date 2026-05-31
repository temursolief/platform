'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import type { VocabularyEntry } from '@/lib/types'

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

// ─── Rating config ────────────────────────────────────────────────────────────
const RATINGS = [
  { label: 'Again', value: 0, desc: 'Completely forgot', style: { background: 'var(--rose-soft)', color: 'var(--rose)', border: '1.5px solid var(--rose)' } },
  { label: 'Hard',  value: 1, desc: 'Struggled to recall', style: { background: 'var(--surface-2)', color: 'var(--ink-soft)', border: '1.5px solid var(--line)' } },
  { label: 'Good',  value: 2, desc: 'Remembered with effort', style: { background: 'var(--primary-soft)', color: 'var(--primary)', border: '1.5px solid var(--primary)' } },
  { label: 'Easy',  value: 3, desc: 'Remembered instantly', style: { background: 'var(--accent-soft)', color: 'var(--accent)', border: '1.5px solid var(--accent)' } },
]

// ─── Session complete ─────────────────────────────────────────────────────────
function SessionComplete({ reviewed, onRestart }: { reviewed: number; onRestart: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div
        className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
        style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
      >
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
        <button
          onClick={onRestart}
          className="px-6 py-3 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'var(--primary)' }}
        >
          Review again
        </button>
        <Link
          href="/student/vocabulary"
          className="px-6 py-3 rounded-xl text-sm font-semibold"
          style={{ background: 'var(--surface-2)', color: 'var(--ink-soft)' }}
        >
          Back to vocabulary
        </Link>
      </div>
    </div>
  )
}

// ─── Flashcard ────────────────────────────────────────────────────────────────
function Flashcard({
  entry,
  revealed,
  onReveal,
  onRate,
  current,
  total,
}: {
  entry: VocabularyEntry
  revealed: boolean
  onReveal: () => void
  onRate: (rating: number) => void
  current: number
  total: number
}) {
  return (
    <div className="flex flex-col items-center w-full max-w-[640px] mx-auto">
      {/* Progress */}
      <div className="w-full mb-6">
        <div className="flex justify-between text-xs font-semibold mb-2" style={{ color: 'var(--ink-muted)' }}>
          <span>{current} / {total}</span>
          <span>{Math.round((current / total) * 100)}%</span>
        </div>
        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${(current / total) * 100}%`, background: 'var(--primary)' }}
          />
        </div>
      </div>

      {/* Card */}
      <div
        className="w-full rounded-3xl p-8 flex flex-col items-center text-center min-h-[320px] justify-center"
        style={{ background: 'var(--surface)', border: '1.5px solid var(--line)', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}
      >
        {/* Front */}
        <div className="mb-2">
          <span className="text-[10px] font-bold tracking-widest" style={{ color: 'var(--ink-muted)' }}>WORD</span>
        </div>
        <h2 className="text-5xl font-bold mb-2" style={{ color: 'var(--ink)', fontFamily: 'Georgia, serif' }}>
          {entry.word}
        </h2>
        {entry.translation && !revealed && (
          <p className="text-base mt-1" style={{ color: 'var(--ink-muted)' }}>{entry.translation}</p>
        )}

        {/* Back (revealed) */}
        {revealed ? (
          <div className="w-full mt-6 pt-6 space-y-4" style={{ borderTop: '1.5px solid var(--line)' }}>
            <div>
              <span className="text-[10px] font-bold tracking-widest" style={{ color: 'var(--ink-muted)' }}>DEFINITION</span>
              <p className="text-lg mt-1 leading-snug" style={{ color: 'var(--ink-soft)' }}>{entry.definition}</p>
            </div>
            {entry.example_sentence && (
              <div>
                <span className="text-[10px] font-bold tracking-widest" style={{ color: 'var(--ink-muted)' }}>EXAMPLE</span>
                <p className="text-base mt-1 italic" style={{ color: 'var(--ink-soft)' }}>&ldquo;{entry.example_sentence}&rdquo;</p>
              </div>
            )}
            {entry.translation && (
              <div>
                <span className="text-[10px] font-bold tracking-widest" style={{ color: 'var(--ink-muted)' }}>TRANSLATION</span>
                <p className="text-base mt-1 font-medium" style={{ color: 'var(--ink)' }}>{entry.translation}</p>
              </div>
            )}
            {entry.notes && (
              <div>
                <span className="text-[10px] font-bold tracking-widest" style={{ color: 'var(--ink-muted)' }}>NOTES</span>
                <p className="text-sm mt-1" style={{ color: 'var(--ink-muted)' }}>{entry.notes}</p>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={onReveal}
            className="mt-8 px-8 py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ background: 'var(--ink)', color: 'white' }}
          >
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
              <button
                key={r.value}
                onClick={() => onRate(r.value)}
                className="flex flex-col items-center py-3 px-2 rounded-2xl font-semibold transition-opacity hover:opacity-80"
                style={r.style}
              >
                <span className="text-sm font-bold">{r.label}</span>
                <span className="text-[10px] mt-0.5 opacity-70">{r.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Keyboard hint */}
      {!revealed && (
        <p className="mt-4 text-xs" style={{ color: 'var(--ink-muted)' }}>
          Press <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono" style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>Space</kbd> to reveal
        </p>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function FlashcardReviewPage() {
  const [cards, setCards] = useState<VocabularyEntry[]>([])
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
      const res = await fetch('/api/vocabulary/review')
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }

      // Flatten review join (Supabase returns array for joined table)
      type RawEntry = Omit<VocabularyEntry, 'review'> & { review: VocabularyEntry['review'][] | null }
      const raw = data.entries as RawEntry[]
      const entries: VocabularyEntry[] = raw.map((e) => ({
        ...e,
        review: Array.isArray(e.review) ? e.review[0] ?? undefined : e.review ?? undefined,
      }))

      setCards(entries)
      setIndex(0)
      setRevealed(false)
      setReviewed(0)
      setDone(entries.length === 0)
    } catch {
      setError('Failed to load cards.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadCards() }, [loadCards])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (done || loading) return
      if (e.code === 'Space' && !revealed) {
        e.preventDefault()
        setRevealed(true)
      }
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

  const handleReveal = () => setRevealed(true)

  const handleRate = async (rating: number) => {
    const card = cards[index]
    if (!card) return

    // Optimistic advance
    const nextIndex = index + 1
    const newReviewed = reviewed + 1
    setReviewed(newReviewed)

    if (nextIndex >= cards.length) {
      setDone(true)
    } else {
      setIndex(nextIndex)
      setRevealed(false)
    }

    // Submit to API (fire and forget)
    fetch(`/api/vocabulary/${card.id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating }),
    })
  }

  const handleRestart = () => {
    setDone(false)
    loadCards()
  }

  if (loading) {
    return (
      <div className="py-8 px-10 flex items-center justify-center min-h-[60vh]">
        <p style={{ color: 'var(--ink-muted)' }}>Loading cards…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-8 px-10">
        <p style={{ color: 'var(--rose)' }}>{error}</p>
        <Link href="/student/vocabulary" className="text-sm mt-4 inline-block" style={{ color: 'var(--primary)' }}>
          ← Back to vocabulary
        </Link>
      </div>
    )
  }

  return (
    <div className="py-8 px-10 max-w-[900px]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/student/vocabulary"
          className="flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-70"
          style={{ color: 'var(--ink-muted)' }}
        >
          <ArrowLeftIcon /> Vocabulary
        </Link>
        <span style={{ color: 'var(--line)' }}>/</span>
        <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Review session</span>
      </div>

      {done ? (
        <SessionComplete reviewed={reviewed} onRestart={handleRestart} />
      ) : cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <TrophyIcon />
          <h2 className="text-2xl font-bold mt-6 mb-2" style={{ color: 'var(--ink)', fontFamily: 'Georgia, serif' }}>All caught up!</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--ink-muted)' }}>No cards due right now. Check back later.</p>
          <Link href="/student/vocabulary" className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>
            ← Back to vocabulary
          </Link>
        </div>
      ) : (
        <>
          {/* Keyboard hints */}
          <div className="mb-6 text-center">
            <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
              {revealed
                ? <>Rate: <kbd className="mx-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono" style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>1</kbd> Again &nbsp;
                  <kbd className="mx-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono" style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>2</kbd> Hard &nbsp;
                  <kbd className="mx-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono" style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>3</kbd> Good &nbsp;
                  <kbd className="mx-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono" style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>4</kbd> Easy</>
                : 'Think about the definition before revealing the answer'}
            </p>
          </div>

          <Flashcard
            entry={cards[index]}
            revealed={revealed}
            onReveal={handleReveal}
            onRate={handleRate}
            current={index + 1}
            total={cards.length}
          />
        </>
      )}
    </div>
  )
}
