'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { VocabularyEntry } from '@/lib/types'
import type { ParsedVocabularyEntry } from '@/lib/vocabulary/parse-import'
import { ImportVocabularyModal } from '@/components/vocabulary/ImportVocabularyModal'

// ─── Icons ──────────────────────────────────────────────────────────────────
const PlusIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14"/>
  </svg>
)
const TrashIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18M19 6l-1 14H6L5 6M10 6V4h4v2"/>
  </svg>
)
const CardsIcon = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2"/>
    <path d="M2 10h20"/>
  </svg>
)
const BookIcon = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2V5Z"/><path d="M4 19a2 2 0 0 1 2-2h12"/>
  </svg>
)
const ChevronDown = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9l6 6 6-6"/>
  </svg>
)

// ─── Add Word Form ────────────────────────────────────────────────────────────
function AddWordForm({ onAdd }: { onAdd: (entry: VocabularyEntry) => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    word: '', definition: '', example_sentence: '', translation: '', notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/vocabulary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      onAdd(data.entry)
      setForm({ word: '', definition: '', example_sentence: '', translation: '', notes: '' })
      setOpen(false)
    } catch {
      setError('Network error. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1.5px solid var(--line)', background: 'var(--surface)' }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold transition-colors hover:bg-[var(--surface-2)]"
        style={{ color: 'var(--ink)' }}
      >
        <div className="flex items-center gap-2">
          <PlusIcon />
          Add new word
        </div>
        <span style={{ transform: open ? 'rotate(180deg)' : undefined, transition: 'transform 0.2s', display: 'inline-block' }}>
          <ChevronDown />
        </span>
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="px-5 pb-5 pt-0" style={{ borderTop: '1px solid var(--line)' }}>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div>
              <label className="text-[10px] font-bold tracking-widest block mb-1" style={{ color: 'var(--ink-muted)' }}>WORD *</label>
              <input
                required
                value={form.word}
                onChange={e => setForm(f => ({ ...f, word: e.target.value }))}
                placeholder="e.g. ubiquitous"
                className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                style={{ background: 'var(--surface-2)', border: '1.5px solid var(--line)', color: 'var(--ink)' }}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold tracking-widest block mb-1" style={{ color: 'var(--ink-muted)' }}>TRANSLATION</label>
              <input
                value={form.translation}
                onChange={e => setForm(f => ({ ...f, translation: e.target.value }))}
                placeholder="in your language"
                className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                style={{ background: 'var(--surface-2)', border: '1.5px solid var(--line)', color: 'var(--ink)' }}
              />
            </div>
          </div>

          <div className="mt-3">
            <label className="text-[10px] font-bold tracking-widest block mb-1" style={{ color: 'var(--ink-muted)' }}>DEFINITION *</label>
            <textarea
              required
              rows={2}
              value={form.definition}
              onChange={e => setForm(f => ({ ...f, definition: e.target.value }))}
              placeholder="Present or existing everywhere at the same time"
              className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none"
              style={{ background: 'var(--surface-2)', border: '1.5px solid var(--line)', color: 'var(--ink)' }}
            />
          </div>

          <div className="mt-3">
            <label className="text-[10px] font-bold tracking-widest block mb-1" style={{ color: 'var(--ink-muted)' }}>EXAMPLE SENTENCE</label>
            <input
              value={form.example_sentence}
              onChange={e => setForm(f => ({ ...f, example_sentence: e.target.value }))}
              placeholder="Mobile phones have become ubiquitous in modern life."
              className="w-full px-3 py-2 rounded-xl text-sm outline-none"
              style={{ background: 'var(--surface-2)', border: '1.5px solid var(--line)', color: 'var(--ink)' }}
            />
          </div>

          <div className="mt-3">
            <label className="text-[10px] font-bold tracking-widest block mb-1" style={{ color: 'var(--ink-muted)' }}>NOTES</label>
            <input
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Optional memory hook or context"
              className="w-full px-3 py-2 rounded-xl text-sm outline-none"
              style={{ background: 'var(--surface-2)', border: '1.5px solid var(--line)', color: 'var(--ink)' }}
            />
          </div>

          {error && (
            <p className="mt-3 text-sm" style={{ color: 'var(--rose)' }}>{error}</p>
          )}

          <div className="flex gap-3 mt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: 'var(--primary)' }}
            >
              {loading ? 'Saving…' : 'Save word'}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: 'var(--surface-2)', color: 'var(--ink-soft)' }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

// ─── Word Card ────────────────────────────────────────────────────────────────
function WordCard({ entry, onDelete }: { entry: VocabularyEntry; onDelete: (id: string) => void }) {
  const [deleting, setDeleting] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const isDue = entry.review && entry.review.due_date <= today

  const handleDelete = async () => {
    if (!confirm(`Remove "${entry.word}" from your vocabulary?`)) return
    setDeleting(true)
    await fetch(`/api/vocabulary/${entry.id}`, { method: 'DELETE' })
    onDelete(entry.id)
  }

  return (
    <div
      className="rounded-2xl p-4 transition-all"
      style={{ background: 'var(--surface)', border: '1.5px solid var(--line)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-bold" style={{ color: 'var(--ink)', fontFamily: 'Georgia, serif' }}>
              {entry.word}
            </span>
            {entry.translation && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'var(--surface-2)', color: 'var(--ink-muted)' }}>
                {entry.translation}
              </span>
            )}
            {isDue && (
              <span className="text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-full" style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
                DUE
              </span>
            )}
            {entry.review && entry.review.repetitions > 0 && !isDue && (
              <span className="text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-full" style={{ background: 'var(--surface-2)', color: 'var(--ink-muted)' }}>
                in {Math.max(0, Math.round((new Date(entry.review.due_date).getTime() - Date.now()) / 86400000))}d
              </span>
            )}
          </div>
          <p className="text-sm mt-1.5 leading-snug" style={{ color: 'var(--ink-soft)' }}>
            {entry.definition}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg transition-colors hover:bg-[var(--surface-2)]"
            style={{ color: 'var(--ink-muted)' }}
            title="Details"
          >
            <span style={{ transform: expanded ? 'rotate(180deg)' : undefined, transition: 'transform 0.2s', display: 'inline-block' }}>
              <ChevronDown />
            </span>
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-1.5 rounded-lg transition-colors hover:bg-[var(--rose-soft)] disabled:opacity-50"
            style={{ color: 'var(--ink-muted)' }}
            title="Remove"
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 space-y-2" style={{ borderTop: '1px solid var(--line)' }}>
          {entry.example_sentence && (
            <div>
              <span className="text-[10px] font-bold tracking-widest" style={{ color: 'var(--ink-muted)' }}>EXAMPLE</span>
              <p className="text-sm mt-0.5 italic" style={{ color: 'var(--ink-soft)' }}>&ldquo;{entry.example_sentence}&rdquo;</p>
            </div>
          )}
          {entry.notes && (
            <div>
              <span className="text-[10px] font-bold tracking-widest" style={{ color: 'var(--ink-muted)' }}>NOTES</span>
              <p className="text-sm mt-0.5" style={{ color: 'var(--ink-soft)' }}>{entry.notes}</p>
            </div>
          )}
          {entry.review && (
            <div className="flex gap-4 pt-1">
              <div>
                <span className="text-[10px] font-bold tracking-widest" style={{ color: 'var(--ink-muted)' }}>REVIEWS</span>
                <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{entry.review.repetitions}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-widest" style={{ color: 'var(--ink-muted)' }}>INTERVAL</span>
                <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{entry.review.interval_days}d</p>
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-widest" style={{ color: 'var(--ink-muted)' }}>EASE</span>
                <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{entry.review.ease_factor.toFixed(1)}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main Client Component ────────────────────────────────────────────────────
interface Props {
  initialEntries: VocabularyEntry[]
  dueCount: number
}

const UploadIcon = () => (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>
  </svg>
)

export function VocabularyClient({ initialEntries, dueCount: initialDueCount }: Props) {
  const [entries, setEntries] = useState<VocabularyEntry[]>(initialEntries)
  const [search, setSearch] = useState('')
  const [showImport, setShowImport] = useState(false)

  const dueCount = entries.filter((e) => {
    const today = new Date().toISOString().split('T')[0]
    return e.review && e.review.due_date <= today
  }).length

  const filtered = entries.filter((e) =>
    !search || e.word.toLowerCase().includes(search.toLowerCase()) ||
    e.definition.toLowerCase().includes(search.toLowerCase())
  )

  const handleAdd = (entry: VocabularyEntry) => {
    setEntries((prev) => [entry, ...prev])
  }

  const handleDelete = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  const handleImported = async (_parsed: ParsedVocabularyEntry[], savedCount: number) => {
    if (savedCount === 0) return
    // Re-fetch entries to get proper IDs, review state, etc.
    try {
      const res = await fetch('/api/vocabulary')
      const data = await res.json()
      if (res.ok && data.entries) {
        type RawEntry = Omit<VocabularyEntry, 'review'> & { review: VocabularyEntry['review'][] | null }
        const raw = data.entries as RawEntry[]
        const fresh: VocabularyEntry[] = raw.map((e) => ({
          ...e,
          review: Array.isArray(e.review) ? e.review[0] ?? undefined : e.review ?? undefined,
        }))
        setEntries(fresh)
      }
    } catch { /* keep existing state */ }
  }

  return (
    <div>
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'TOTAL WORDS', value: entries.length, color: 'var(--ink)' },
          { label: 'DUE TODAY', value: dueCount, color: dueCount > 0 ? 'var(--primary)' : 'var(--ink)' },
          { label: 'MASTERED', value: entries.filter(e => (e.review?.repetitions ?? 0) >= 4).length, color: 'var(--accent)' },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1.5px solid var(--line)' }}>
            <div className="text-[10px] font-bold tracking-widest mb-1" style={{ color: 'var(--ink-muted)' }}>{s.label}</div>
            <div className="text-4xl font-bold leading-none" style={{ color: s.color, fontFamily: 'Georgia, serif' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Review CTA */}
      {dueCount > 0 && (
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
                {dueCount} card{dueCount !== 1 ? 's' : ''} due for review
              </p>
              <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>Keep your streak going</p>
            </div>
          </div>
          <a
            href="/student/vocabulary/review"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'var(--primary)' }}
          >
            Study now
          </a>
        </div>
      )}

      {/* Add word form + import */}
      <div className="mb-6 space-y-3">
        <AddWordForm onAdd={handleAdd} />
        <button
          onClick={() => setShowImport(true)}
          className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold transition-colors hover:bg-[var(--surface-2)]"
          style={{ background: 'var(--surface)', border: '1.5px solid var(--line)', color: 'var(--ink-soft)' }}
        >
          <UploadIcon />
          Import from .apkg or .json
        </button>
      </div>

      {showImport && (
        <ImportVocabularyModal
          context="student"
          onImported={handleImported}
          onClose={() => setShowImport(false)}
        />
      )}

      {/* Word list */}
      {entries.length === 0 ? (
        <div className="rounded-2xl p-16 text-center" style={{ background: 'var(--surface)', border: '1.5px solid var(--line)' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
               style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
            <BookIcon />
          </div>
          <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--ink)', fontFamily: 'Georgia, serif' }}>No words yet</h3>
          <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>Add vocabulary words you want to memorise using the form above.</p>
        </div>
      ) : (
        <>
          {entries.length > 4 && (
            <div className="mb-4">
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search words…"
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: 'var(--surface)', border: '1.5px solid var(--line)', color: 'var(--ink)' }}
              />
            </div>
          )}
          <div className="space-y-3">
            {filtered.map((entry) => (
              <WordCard key={entry.id} entry={entry} onDelete={handleDelete} />
            ))}
            {filtered.length === 0 && (
              <p className="text-sm text-center py-8" style={{ color: 'var(--ink-muted)' }}>No words match &ldquo;{search}&rdquo;</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
