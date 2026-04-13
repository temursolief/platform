'use client'

import { useState, useRef } from 'react'
import { Upload, FileJson, X, CheckCircle2, AlertTriangle, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import type { Difficulty } from '@/lib/types'

interface RawQuestion {
  number?: number
  type?: string
  question_text?: string
  image_url?: string
  options?: string[]
  match_options?: string[]
  word_bank?: string[]
  correct_answer?: string
  acceptable_answers?: string[]
  hint?: string
}

interface RawQuestionGroup {
  instructions?: string
  image_url?: string
  match_options?: string[]
  word_bank?: string[]
  questions: RawQuestion[]
}

/** Shape of a single passage JSON file */
interface ParsedPassage {
  title: string
  instructions?: string
  passage_html?: string
  questions?: RawQuestion[]
  question_groups?: RawQuestionGroup[]
}

interface PassageSlot {
  file: File | null
  parsed: ParsedPassage | null
  error: string | null
}

function emptySlot(): PassageSlot {
  return { file: null, parsed: null, error: null }
}

function questionCount(p: ParsedPassage): number {
  const direct = p.questions?.length ?? 0
  const grouped = (p.question_groups ?? []).reduce((a, g) => a + (g.questions?.length ?? 0), 0)
  return direct + grouped
}

interface TestUploadFormProps {
  onSuccess?: (result: { testIds: string[]; mode: 'test' | 'practice' }) => void
}

export function TestUploadForm({ onSuccess }: TestUploadFormProps) {
  const [slots, setSlots] = useState<[PassageSlot, PassageSlot, PassageSlot]>([
    emptySlot(), emptySlot(), emptySlot(),
  ])
  const [testTitle, setTestTitle] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>('intermediate')
  const [timeLimit, setTimeLimit] = useState(60)
  const [warnings, setWarnings] = useState<string[]>([])
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const fileRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  const loadPassage = (index: number, file: File) => {
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string) as ParsedPassage
        if (!json.title) throw new Error('Missing required field: "title"')
        if (!json.questions && !json.question_groups) {
          throw new Error('Must include "questions" or "question_groups"')
        }
        updateSlot(index, { file, parsed: json, error: null })
      } catch (err) {
        updateSlot(index, {
          file,
          parsed: null,
          error: err instanceof Error ? err.message : 'Invalid JSON file.',
        })
      }
    }
    reader.readAsText(file)
  }

  const updateSlot = (index: number, patch: Partial<PassageSlot>) => {
    setSlots((prev) => {
      const next = [...prev] as [PassageSlot, PassageSlot, PassageSlot]
      next[index] = { ...next[index], ...patch }
      return next
    })
  }

  const clearSlot = (index: number) => {
    updateSlot(index, emptySlot())
    if (fileRefs[index].current) fileRefs[index].current!.value = ''
  }

  const uploadedSlots = slots.filter((s) => s.parsed !== null)
  const hasPassages = uploadedSlots.length > 0
  const hasErrors = slots.some((s) => s.error !== null)

  // Build section payloads from uploaded passages
  const buildSections = () =>
    slots
      .filter((s) => s.parsed !== null)
      .map((s) => ({
        title: s.parsed!.title,
        instructions: s.parsed!.instructions ?? null,
        passage_html: s.parsed!.passage_html ?? null,
        questions: s.parsed!.questions ?? [],
        question_groups: s.parsed!.question_groups ?? [],
      }))

  const createTest = async () => {
    if (!testTitle.trim()) {
      setGlobalError('Please enter a test title.')
      return
    }
    if (!hasPassages) return
    setLoading(true)
    setGlobalError(null)
    setWarnings([])

    try {
      const res = await fetch('/api/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: testTitle.trim(),
          type: 'reading',
          difficulty,
          time_limit_minutes: timeLimit,
          sections: buildSections(),
        }),
      })

      const contentType = res.headers.get('content-type') ?? ''
      if (!contentType.includes('application/json')) {
        const text = await res.text()
        throw new Error(`Unexpected server response (${res.status}): ${text.slice(0, 200)}`)
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `Server error ${res.status}`)
      if (!data.test?.id) throw new Error('Server did not return a test ID.')
      if (data.warnings?.length) setWarnings(data.warnings)

      onSuccess?.({ testIds: [data.test.id], mode: 'test' })
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const publishAsPractice = async () => {
    if (!hasPassages) return
    setLoading(true)
    setGlobalError(null)
    setWarnings([])

    const testIds: string[] = []
    const allWarnings: string[] = []

    try {
      for (const slot of slots) {
        if (!slot.parsed) continue

        const res = await fetch('/api/tests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: slot.parsed.title,
            type: 'reading',
            difficulty,
            time_limit_minutes: timeLimit,
            is_published: true,
            sections: [
              {
                title: slot.parsed.title,
                instructions: slot.parsed.instructions ?? null,
                passage_html: slot.parsed.passage_html ?? null,
                questions: slot.parsed.questions ?? [],
                question_groups: slot.parsed.question_groups ?? [],
              },
            ],
          }),
        })

        const contentType = res.headers.get('content-type') ?? ''
        if (!contentType.includes('application/json')) {
          const text = await res.text()
          allWarnings.push(`"${slot.parsed.title}": unexpected server response — ${text.slice(0, 100)}`)
          continue
        }
        const data = await res.json()
        if (!res.ok) {
          allWarnings.push(`"${slot.parsed.title}": ${data.error ?? `server error ${res.status}`}`)
          continue
        }
        if (data.test?.id) testIds.push(data.test.id)
        if (data.warnings?.length) allWarnings.push(...data.warnings)
      }

      if (allWarnings.length) setWarnings(allWarnings)
      if (testIds.length === 0) throw new Error('No passages were published successfully.')

      onSuccess?.({ testIds, mode: 'practice' })
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">

      {/* ── Passage Upload Slots ── */}
      <div>
        <p className="text-sm font-semibold text-neutral-700 mb-3">
          Upload Passages (1–3)
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {([0, 1, 2] as const).map((idx) => {
            const slot = slots[idx]
            const label = `Passage ${idx + 1}`
            const isOptional = idx > 0

            return (
              <div key={idx} className="flex flex-col gap-2">
                <p className="text-xs font-medium text-neutral-600">
                  {label}{isOptional && <span className="text-neutral-400 ml-1">(optional)</span>}
                </p>

                <input
                  ref={fileRefs[idx]}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) loadPassage(idx, f)
                  }}
                />

                {slot.parsed ? (
                  /* Parsed success card */
                  <div className="border border-emerald-200 bg-emerald-50 rounded-xl p-3 flex flex-col gap-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <CheckCircle2 size={14} className="text-emerald-600 flex-shrink-0" />
                        <span className="text-xs font-medium text-emerald-800 truncate">{slot.parsed.title}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => clearSlot(idx)}
                        className="p-0.5 hover:bg-emerald-200 rounded flex-shrink-0"
                      >
                        <X size={13} className="text-emerald-700" />
                      </button>
                    </div>
                    <p className="text-xs text-emerald-700">{questionCount(slot.parsed)} questions</p>
                  </div>
                ) : slot.error ? (
                  /* Error card */
                  <div className="border border-red-200 bg-red-50 rounded-xl p-3">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <AlertTriangle size={14} className="text-red-500 flex-shrink-0" />
                        <span className="text-xs font-medium text-red-700 truncate">{slot.file?.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => clearSlot(idx)}
                        className="p-0.5 hover:bg-red-200 rounded flex-shrink-0"
                      >
                        <X size={13} className="text-red-600" />
                      </button>
                    </div>
                    <p className="text-xs text-red-600">{slot.error}</p>
                  </div>
                ) : (
                  /* Empty upload zone */
                  <button
                    type="button"
                    onClick={() => fileRefs[idx].current?.click()}
                    className="border-2 border-dashed border-neutral-200 hover:border-neutral-400 rounded-xl p-4 flex flex-col items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Upload size={20} className="text-neutral-400" />
                    <span className="text-xs text-neutral-500 text-center">Click to upload JSON</span>
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Summary of uploaded passages ── */}
      {hasPassages && (
        <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={14} className="text-neutral-500" />
            <span className="text-xs font-medium text-neutral-700">
              {uploadedSlots.length} passage{uploadedSlots.length !== 1 ? 's' : ''} ready
              {' '}·{' '}
              {uploadedSlots.reduce((a, s) => a + questionCount(s.parsed!), 0)} questions total
            </span>
          </div>
        </div>
      )}

      {/* ── Settings (shared by both actions) ── */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-neutral-700">Settings</p>
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </Select>
          <Input
            label="Time limit (min)"
            type="number"
            value={timeLimit}
            onChange={(e) => setTimeLimit(parseInt(e.target.value) || 60)}
            min={1}
            max={240}
          />
        </div>
      </div>

      {/* ── Warnings ── */}
      {warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={14} className="text-amber-600 flex-shrink-0" />
            <span className="text-sm font-medium text-amber-800">Some items could not be imported:</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5">
            {warnings.map((w, i) => (
              <li key={i} className="text-xs text-amber-700">{w}</li>
            ))}
          </ul>
        </div>
      )}

      {globalError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {globalError}
        </div>
      )}

      {/* ── JSON format reference ── */}
      <details className="group border border-neutral-200 rounded-xl overflow-hidden">
        <summary className="flex items-center justify-between px-4 py-3 cursor-pointer bg-neutral-50 hover:bg-neutral-100 transition-colors select-none list-none">
          <div className="flex items-center gap-2">
            <FileJson size={15} className="text-neutral-500" />
            <span className="text-sm font-medium text-neutral-700">Passage JSON format &amp; question types</span>
          </div>
          <span className="text-xs text-neutral-400 group-open:hidden">Show</span>
          <span className="text-xs text-neutral-400 hidden group-open:inline">Hide</span>
        </summary>

        <div className="px-4 pb-4 pt-3 space-y-4 bg-white">

          {/* Top-level structure */}
          <div>
            <p className="text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-2">File structure</p>
            <pre className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-xs text-neutral-700 overflow-x-auto leading-relaxed">{`{
  "title":        "The History of Photography",   // required
  "instructions": "Questions 1–13. Read and answer.",  // optional
  "passage_html": "<p>Passage text here…</p>",    // optional

  // Use "questions" for a flat list, or "question_groups" to share
  // options/word-banks across a group, or mix both.
  "questions": [ … ],
  "question_groups": [ … ]
}`}</pre>
          </div>

          {/* Question types table */}
          <div>
            <p className="text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-2">Supported question types</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {[
                { type: 'true_false_ng',    label: 'True / False / Not Given',         answer: '"True" | "False" | "Not Given"' },
                { type: 'yes_no_ng',        label: 'Yes / No / Not Given',             answer: '"Yes" | "No" | "Not Given"' },
                { type: 'multiple_choice',  label: 'Multiple Choice (A–D)',            answer: '"A" | "B" | "C" | "D"' },
                { type: 'matching_headings',label: 'Matching Headings',                answer: '"i" | "ii" … (use match_options)' },
                { type: 'matching_information', label: 'Matching Information',         answer: '"A" | "B" … (use match_options)' },
                { type: 'matching_features',label: 'Matching Features',                answer: '"A" | "B" … (use match_options)' },
                { type: 'matching_sentence_endings', label: 'Matching Sentence Endings', answer: '"A" | "B" … (use match_options)' },
                { type: 'sentence_completion', label: 'Sentence Completion',           answer: '"exact word(s)"' },
                { type: 'summary_completion', label: 'Summary Completion',             answer: '"exact word(s)"' },
                { type: 'note_table_flowchart_completion', label: 'Note/Table/Flowchart', answer: '"exact word(s)"' },
                { type: 'diagram_label',    label: 'Diagram Labelling',                answer: '"exact label text"' },
                { type: 'short_answer',     label: 'Short Answer',                     answer: '"word or phrase"' },
              ].map(({ type, label, answer }) => (
                <div key={type} className="flex items-start gap-2 bg-neutral-50 rounded-lg px-3 py-2">
                  <code className="bg-white border border-neutral-200 rounded px-1.5 py-0.5 text-[10px] font-mono text-neutral-700 flex-shrink-0 whitespace-nowrap">{type}</code>
                  <div className="min-w-0">
                    <p className="font-medium text-neutral-800 leading-tight">{label}</p>
                    <p className="text-neutral-400 leading-tight mt-0.5">{answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Full worked example */}
          <div>
            <p className="text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-2">Full example</p>
            <pre className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-xs text-neutral-700 overflow-x-auto leading-relaxed">{`{
  "title": "Urban Green Spaces",
  "instructions": "Questions 1–13. Read the passage and answer the questions.",
  "passage_html": "<p>Cities around the world are rediscovering…</p>",

  "questions": [

    // ── True / False / Not Given ──────────────────────────────
    {
      "number": 1,
      "type": "true_false_ng",
      "question_text": "Green spaces improve mental health.",
      "correct_answer": "True"
    },

    // ── Yes / No / Not Given ──────────────────────────────────
    {
      "number": 2,
      "type": "yes_no_ng",
      "question_text": "The author supports mandatory park quotas.",
      "correct_answer": "Yes"
    },

    // ── Multiple Choice ───────────────────────────────────────
    {
      "number": 3,
      "type": "multiple_choice",
      "question_text": "What is the main argument of paragraph 2?",
      "options": [
        "Green spaces are expensive to maintain",
        "Urban planners ignore resident needs",
        "Nature contact reduces stress hormones",
        "City councils lack funding"
      ],
      "correct_answer": "C"
    },

    // ── Sentence Completion ───────────────────────────────────
    {
      "number": 4,
      "type": "sentence_completion",
      "question_text": "Researchers found that even ___ minutes outdoors reduced cortisol.",
      "correct_answer": "twenty",
      "acceptable_answers": ["20"]
    },

    // ── Short Answer ──────────────────────────────────────────
    {
      "number": 5,
      "type": "short_answer",
      "question_text": "Name ONE city used as a case study in the passage.",
      "correct_answer": "Singapore",
      "acceptable_answers": ["singapore"]
    }
  ],

  "question_groups": [

    // ── Matching Headings (shared list of headings) ───────────
    {
      "instructions": "Questions 6–8. Choose the correct heading for paragraphs A–C.",
      "match_options": [
        "i. The economic case for parks",
        "ii. Historical origins of urban greenery",
        "iii. Health benefits confirmed by research",
        "iv. Challenges facing city planners",
        "v. International policy recommendations"
      ],
      "questions": [
        { "number": 6, "type": "matching_headings",
          "question_text": "Paragraph A", "correct_answer": "ii" },
        { "number": 7, "type": "matching_headings",
          "question_text": "Paragraph B", "correct_answer": "iii" },
        { "number": 8, "type": "matching_headings",
          "question_text": "Paragraph C", "correct_answer": "i" }
      ]
    },

    // ── Matching Information (which paragraph A–E?) ───────────
    {
      "instructions": "Questions 9–11. Which paragraph contains the following information?",
      "match_options": ["A", "B", "C", "D", "E"],
      "questions": [
        { "number": 9,  "type": "matching_information",
          "question_text": "A reference to an unexpected research finding", "correct_answer": "C" },
        { "number": 10, "type": "matching_information",
          "question_text": "A comparison between two different cities",    "correct_answer": "A" }
      ]
    },

    // ── Summary Completion with word bank ────────────────────
    {
      "instructions": "Questions 11–13. Complete the summary. Choose ONE WORD from the box.",
      "word_bank": ["pollution", "biodiversity", "funding", "access", "policy"],
      "questions": [
        { "number": 11, "type": "summary_completion",
          "question_text": "Limited ___ means low-income areas have fewer parks.",
          "correct_answer": "funding" },
        { "number": 12, "type": "summary_completion",
          "question_text": "Parks also support urban ___ by attracting native species.",
          "correct_answer": "biodiversity" },
        { "number": 13, "type": "summary_completion",
          "question_text": "Improving ___ to green space is a key recommendation.",
          "correct_answer": "access" }
      ]
    }
  ]
}`}</pre>
          </div>

        </div>
      </details>

      {/* ── Actions ── */}
      <div className="border-t border-neutral-200 pt-4 space-y-3">
        {/* Create Test action */}
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Input
              label="Test title (for Create Test)"
              value={testTitle}
              onChange={(e) => setTestTitle(e.target.value)}
              placeholder="e.g., Cambridge IELTS 18 — Reading Test 1"
            />
          </div>
          <Button
            type="button"
            onClick={createTest}
            disabled={!hasPassages || hasErrors || loading}
            loading={loading}
            className="flex-shrink-0"
          >
            Create Test
          </Button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 border-t border-neutral-200" />
          <span className="text-xs text-neutral-400">or</span>
          <div className="flex-1 border-t border-neutral-200" />
        </div>

        {/* Practice action */}
        <div>
          <Button
            type="button"
            variant="secondary"
            onClick={publishAsPractice}
            disabled={!hasPassages || hasErrors || loading}
            loading={loading}
            className="w-full"
          >
            Publish as Practice Passages
          </Button>
          <p className="text-xs text-neutral-400 text-center mt-1.5">
            Each passage is published immediately as a standalone practice test
          </p>
        </div>
      </div>
    </div>
  )
}
