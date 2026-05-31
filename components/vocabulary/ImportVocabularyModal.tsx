'use client'

import { useState, useRef, useCallback } from 'react'
import type { ParsedVocabularyEntry } from '@/lib/vocabulary/parse-import'

// ─── Icons ────────────────────────────────────────────────────────────────────
const UploadIcon = () => (
  <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>
  </svg>
)
const CheckIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5"/>
  </svg>
)
const XIcon = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18M6 6l12 12"/>
  </svg>
)
const ChevronDown = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9l6 6 6-6"/>
  </svg>
)
const JsonIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>
    <path d="M10 13a2 2 0 0 0-2 2 2 2 0 0 0 2 2M14 13a2 2 0 0 1 2 2 2 2 0 0 1-2 2"/>
  </svg>
)
const AnkiIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M8 5v14M12 10v9"/>
  </svg>
)

// ─── Format examples ──────────────────────────────────────────────────────────
const JSON_EXAMPLE = `[
  {
    "word": "ubiquitous",
    "definition": "Present everywhere at the same time",
    "example_sentence": "Mobile phones have become ubiquitous.",
    "translation": "keng tarqalgan",
    "notes": "From Latin ubique = everywhere"
  },
  {
    "word": "meticulous",
    "definition": "Showing great attention to detail",
    "example_sentence": "She was meticulous in her research.",
    "translation": "puxta, aniq",
    "notes": "Optional field"
  }
]`

// ─── Step types ────────────────────────────────────────────────────────────────
type Step = 'upload' | 'preview' | 'done'

// ─── Overlay ──────────────────────────────────────────────────────────────────
function Overlay({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    />
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────
export interface ImportVocabularyModalProps {
  /** 'student' | 'teacher' — controls which save endpoint is called */
  context: 'student' | 'teacher'
  /** Required when context='teacher': the sectionId to save to */
  sectionId?: string
  /** Called after entries are saved — passes back saved count */
  onImported: (entries: ParsedVocabularyEntry[], savedCount: number) => void
  onClose: () => void
}

// ─── Main Modal ──────────────────────────────────────────────────────────────
export function ImportVocabularyModal({ context, sectionId, onImported, onClose }: ImportVocabularyModalProps) {
  const [step, setStep] = useState<Step>('upload')
  const [entries, setEntries] = useState<ParsedVocabularyEntry[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [parsing, setParsing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [savedCount, setSavedCount] = useState(0)
  const [format, setFormat] = useState<'apkg' | 'json' | null>(null)
  const [dragging, setDragging] = useState(false)
  const [showFormatGuide, setShowFormatGuide] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const parseFile = useCallback(async (file: File) => {
    setParsing(true)
    setParseError(null)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch('/api/vocabulary/parse-import', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setParseError(data.error); return }
      setEntries(data.entries)
      setFormat(data.format)
      setSelected(new Set(data.entries.map((_: unknown, i: number) => i)))
      setStep('preview')
    } catch {
      setParseError('Network error. Try again.')
    } finally {
      setParsing(false)
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) parseFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) parseFile(file)
  }

  const toggleEntry = (i: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === entries.length) setSelected(new Set())
    else setSelected(new Set(entries.map((_, i) => i)))
  }

  const handleSave = async () => {
    const toSave = entries.filter((_, i) => selected.has(i))
    if (toSave.length === 0) return
    setSaving(true)
    setSaveError(null)
    try {
      const url = context === 'student'
        ? '/api/vocabulary/bulk'
        : `/api/sections/${sectionId}/flashcards/items/bulk`

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: toSave }),
      })
      const data = await res.json()
      if (!res.ok) { setSaveError(data.error); return }
      setSavedCount(data.saved)
      setStep('done')
      onImported(toSave, data.saved)
    } catch {
      setSaveError('Network error. Try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose} />

      <div
        className="fixed inset-0 z-50 flex items-start justify-center pt-[5vh] px-4 pb-4"
        style={{ pointerEvents: 'none' }}
      >
        <div
          className="relative w-full rounded-2xl overflow-hidden flex flex-col"
          style={{
            maxWidth: '680px',
            maxHeight: '90vh',
            background: 'var(--surface)',
            border: '1.5px solid var(--line)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
            pointerEvents: 'auto',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: '1.5px solid var(--line)' }}>
            <div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--ink)', fontFamily: 'Georgia, serif' }}>
                Import Vocabulary
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--ink-muted)' }}>
                {context === 'student' ? 'Add to your personal word list' : 'Add to this passage collection'}
              </p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl transition-colors hover:bg-[var(--surface-2)]" style={{ color: 'var(--ink-muted)' }}>
              <XIcon />
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1 min-h-0 p-6">

            {/* ── Step: upload ── */}
            {step === 'upload' && (
              <div className="space-y-5">
                {/* Supported formats */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: <AnkiIcon />, label: '.apkg', desc: 'Anki deck export', color: 'var(--sky)' },
                    { icon: <JsonIcon />, label: '.json',  desc: 'Structured text file', color: 'var(--primary)' },
                  ].map((fmt) => (
                    <div key={fmt.label} className="flex items-center gap-3 p-3 rounded-xl"
                         style={{ background: 'var(--surface-2)', border: '1.5px solid var(--line)' }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                           style={{ background: 'var(--surface)', color: fmt.color, border: `1.5px solid ${fmt.color}` }}>
                        {fmt.icon}
                      </div>
                      <div>
                        <p className="text-sm font-bold" style={{ color: 'var(--ink)' }}>{fmt.label}</p>
                        <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>{fmt.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Drop zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-3 cursor-pointer rounded-2xl transition-colors py-12"
                  style={{
                    border: `2px dashed ${dragging ? 'var(--primary)' : 'var(--line)'}`,
                    background: dragging ? 'var(--primary-soft)' : 'var(--surface-2)',
                  }}
                >
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                       style={{ background: 'var(--surface)', color: 'var(--primary)', border: '1.5px solid var(--line)' }}>
                    {parsing ? (
                      <svg className="animate-spin" width={24} height={24} viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2"/>
                        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                      </svg>
                    ) : <UploadIcon />}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                      {parsing ? 'Parsing file…' : 'Drop file here or click to browse'}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--ink-muted)' }}>
                      .apkg or .json — max 20 MB
                    </p>
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".apkg,.json,application/json"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={parsing}
                  />
                </div>

                {parseError && (
                  <div className="px-4 py-3 rounded-xl text-sm" style={{ background: 'var(--rose-soft)', color: 'var(--rose)', border: '1px solid var(--rose)' }}>
                    {parseError}
                  </div>
                )}

                {/* Format guide (collapsible) */}
                <div className="rounded-2xl overflow-hidden" style={{ border: '1.5px solid var(--line)' }}>
                  <button
                    onClick={() => setShowFormatGuide(!showFormatGuide)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold transition-colors hover:bg-[var(--surface-2)]"
                    style={{ color: 'var(--ink)' }}
                  >
                    Format guide
                    <span style={{ transform: showFormatGuide ? 'rotate(180deg)' : undefined, transition: 'transform 0.2s', display: 'inline-block' }}>
                      <ChevronDown />
                    </span>
                  </button>

                  {showFormatGuide && (
                    <div className="px-4 pb-4 space-y-4" style={{ borderTop: '1px solid var(--line)' }}>

                      {/* APKG guide */}
                      <div className="mt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <AnkiIcon />
                          <span className="text-sm font-bold" style={{ color: 'var(--ink)' }}>Anki .apkg</span>
                        </div>
                        <ul className="text-xs space-y-1 pl-1" style={{ color: 'var(--ink-soft)' }}>
                          <li>• Export any deck from Anki: <strong>File → Export → Anki Deck Package (.apkg)</strong></li>
                          <li>• <strong>Basic</strong> note type: Field 1 → word, Field 2 → definition</li>
                          <li>• Fields named <code className="px-1 rounded" style={{ background: 'var(--surface-2)' }}>Word</code>, <code className="px-1 rounded" style={{ background: 'var(--surface-2)' }}>Front</code>, <code className="px-1 rounded" style={{ background: 'var(--surface-2)' }}>Term</code> are auto-detected as the word</li>
                          <li>• Fields named <code className="px-1 rounded" style={{ background: 'var(--surface-2)' }}>Definition</code>, <code className="px-1 rounded" style={{ background: 'var(--surface-2)' }}>Back</code>, <code className="px-1 rounded" style={{ background: 'var(--surface-2)' }}>Meaning</code> are auto-detected as the definition</li>
                          <li>• HTML is stripped automatically</li>
                          <li>• Cards with empty word are skipped; definition is optional</li>
                        </ul>
                      </div>

                      {/* JSON guide */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <JsonIcon />
                          <span className="text-sm font-bold" style={{ color: 'var(--ink)' }}>JSON format</span>
                        </div>
                        <p className="text-xs mb-2" style={{ color: 'var(--ink-soft)' }}>
                          An array of objects. <code className="px-1 rounded" style={{ background: 'var(--surface-2)' }}>word</code> is required.
                          All other fields including <code className="px-1 rounded" style={{ background: 'var(--surface-2)' }}>definition</code> are optional.
                        </p>
                        <pre
                          className="text-xs rounded-xl p-4 overflow-x-auto leading-relaxed"
                          style={{ background: 'var(--surface-2)', color: 'var(--ink-soft)', fontFamily: 'monospace' }}
                        >
                          {JSON_EXAMPLE}
                        </pre>
                        <p className="text-xs mt-2" style={{ color: 'var(--ink-muted)' }}>
                          Accepted aliases: <code className="px-1 rounded" style={{ background: 'var(--surface-2)' }}>front</code> / <code className="px-1 rounded" style={{ background: 'var(--surface-2)' }}>term</code> for word &nbsp;·&nbsp;
                          <code className="px-1 rounded" style={{ background: 'var(--surface-2)' }}>back</code> / <code className="px-1 rounded" style={{ background: 'var(--surface-2)' }}>meaning</code> for definition &nbsp;·&nbsp;
                          <code className="px-1 rounded" style={{ background: 'var(--surface-2)' }}>note</code> / <code className="px-1 rounded" style={{ background: 'var(--surface-2)' }}>extra</code> for notes
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Step: preview ── */}
            {step === 'preview' && (
              <div className="space-y-4">
                {/* Summary bar */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--ink)' }}>
                      {entries.length} word{entries.length !== 1 ? 's' : ''} parsed
                      {format && (
                        <span className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full"
                              style={{ background: 'var(--surface-2)', color: 'var(--ink-muted)' }}>
                          {format.toUpperCase()}
                        </span>
                      )}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--ink-muted)' }}>
                      {selected.size} selected for import
                    </p>
                  </div>
                  <button
                    onClick={toggleAll}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors hover:bg-[var(--surface-2)]"
                    style={{ color: 'var(--primary)' }}
                  >
                    {selected.size === entries.length ? 'Deselect all' : 'Select all'}
                  </button>
                </div>

                {/* Entry list */}
                <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
                  {entries.map((entry, i) => (
                    <div
                      key={i}
                      onClick={() => toggleEntry(i)}
                      className="flex items-start gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors"
                      style={{
                        background: selected.has(i) ? 'var(--primary-soft)' : 'var(--surface-2)',
                        border: `1.5px solid ${selected.has(i) ? 'var(--primary)' : 'transparent'}`,
                      }}
                    >
                      {/* Checkbox */}
                      <div className="w-5 h-5 rounded-md shrink-0 flex items-center justify-center mt-0.5"
                           style={{
                             background: selected.has(i) ? 'var(--primary)' : 'var(--surface)',
                             border: `1.5px solid ${selected.has(i) ? 'var(--primary)' : 'var(--line)'}`,
                           }}>
                        {selected.has(i) && <span style={{ color: 'white' }}><CheckIcon /></span>}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold" style={{ color: 'var(--ink)' }}>{entry.word}</span>
                          {entry.translation && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full"
                                  style={{ background: 'var(--surface)', color: 'var(--ink-muted)' }}>
                              {entry.translation}
                            </span>
                          )}
                        </div>
                        <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--ink-soft)' }}>
                          {entry.definition}
                        </p>
                        {entry.example_sentence && (
                          <p className="text-xs mt-0.5 italic line-clamp-1" style={{ color: 'var(--ink-muted)' }}>
                            &ldquo;{entry.example_sentence}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {saveError && (
                  <div className="px-4 py-3 rounded-xl text-sm" style={{ background: 'var(--rose-soft)', color: 'var(--rose)', border: '1px solid var(--rose)' }}>
                    {saveError}
                  </div>
                )}
              </div>
            )}

            {/* ── Step: done ── */}
            {step === 'done' && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                     style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                  <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5"/>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--ink)', fontFamily: 'Georgia, serif' }}>
                  Import complete
                </h3>
                <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
                  <strong>{savedCount}</strong> word{savedCount !== 1 ? 's' : ''} added successfully.
                </p>
                {savedCount < selected.size && (
                  <p className="text-xs mt-1" style={{ color: 'var(--ink-muted)' }}>
                    {selected.size - savedCount} duplicate{selected.size - savedCount !== 1 ? 's' : ''} skipped.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          {step !== 'done' && (
            <div className="px-6 py-4 shrink-0 flex items-center justify-between gap-3"
                 style={{ borderTop: '1.5px solid var(--line)' }}>
              {step === 'preview' ? (
                <>
                  <button
                    onClick={() => { setStep('upload'); setEntries([]); setSelected(new Set()) }}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors hover:bg-[var(--surface-2)]"
                    style={{ color: 'var(--ink-muted)' }}
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || selected.size === 0}
                    className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                    style={{ background: 'var(--primary)' }}
                  >
                    {saving ? 'Saving…' : `Import ${selected.size} word${selected.size !== 1 ? 's' : ''}`}
                  </button>
                </>
              ) : (
                <button
                  onClick={onClose}
                  className="ml-auto px-4 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: 'var(--surface-2)', color: 'var(--ink-soft)' }}
                >
                  Cancel
                </button>
              )}
            </div>
          )}

          {step === 'done' && (
            <div className="px-6 py-4 shrink-0" style={{ borderTop: '1.5px solid var(--line)' }}>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: 'var(--primary)' }}
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
