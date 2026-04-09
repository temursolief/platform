'use client'

import { useState, useRef } from 'react'
import { Upload, FileJson, X, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Difficulty, TestType } from '@/lib/types'

interface RawQuestion {
  number?: number
  type?: string
  question_text?: string
  image_url?: string
  /** MC choices (auto-labelled A B C D) */
  options?: string[]
  /** Matching / heading choices (stored verbatim) */
  match_options?: string[]
  /** Word bank for completion-with-word-box questions */
  word_bank?: string[]
  correct_answer?: string
  acceptable_answers?: string[]
  hint?: string
}

interface ParsedTest {
  title: string
  type: TestType
  difficulty: Difficulty
  time_limit_minutes: number
  sections: {
    title?: string
    instructions?: string
    audio_filename?: string
    questions: RawQuestion[]
  }[]
}

interface TestUploadFormProps {
  onSuccess?: (testId: string) => void
}

export function TestUploadForm({ onSuccess }: TestUploadFormProps) {
  const [parsed, setParsed] = useState<ParsedTest | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setError(null)
    setWarnings([])

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string) as ParsedTest

        // Basic validation
        if (!json.title) throw new Error('Missing required field: "title"')
        if (!json.type) throw new Error('Missing required field: "type"')
        if (!['listening', 'reading'].includes(json.type)) {
          throw new Error(`"type" must be "listening" or "reading", got "${json.type}"`)
        }
        if (!Array.isArray(json.sections)) throw new Error('"sections" must be an array')

        setParsed(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Invalid JSON file.')
        setParsed(null)
      }
    }
    reader.readAsText(f)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!parsed) return
    setLoading(true)
    setError(null)
    setWarnings([])

    try {
      const res = await fetch('/api/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      })

      // Parse response safely — Supabase/Next can occasionally return non-JSON
      let data: { test?: { id: string }; error?: string; warnings?: string[] }
      const contentType = res.headers.get('content-type') ?? ''
      if (contentType.includes('application/json')) {
        data = await res.json()
      } else {
        const text = await res.text()
        throw new Error(`Unexpected server response (${res.status}): ${text.slice(0, 200)}`)
      }

      if (!res.ok) {
        throw new Error(data.error ?? `Server error ${res.status}`)
      }

      if (!data.test?.id) {
        throw new Error('Server did not return a test ID.')
      }

      // Partial success — some sections/questions may have warnings
      if (data.warnings?.length) {
        setWarnings(data.warnings)
      }

      onSuccess?.(data.test.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const totalQuestions = parsed?.sections.reduce(
    (acc, s) => acc + (s.questions?.length ?? 0), 0
  ) ?? 0

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation()
    setFile(null)
    setParsed(null)
    setError(null)
    setWarnings([])
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          file
            ? 'border-neutral-900 bg-neutral-50'
            : 'border-neutral-200 hover:border-neutral-400'
        }`}
        onClick={() => fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={handleFileChange}
        />
        {file ? (
          <div className="flex items-center justify-center gap-3">
            <FileJson size={24} className="text-neutral-700 flex-shrink-0" />
            <div className="text-left min-w-0">
              <p className="text-sm font-medium text-neutral-900 truncate">{file.name}</p>
              <p className="text-xs text-neutral-500">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button type="button" onClick={clear} className="ml-auto p-1 hover:bg-neutral-200 rounded flex-shrink-0">
              <X size={16} />
            </button>
          </div>
        ) : (
          <>
            <Upload size={32} className="mx-auto text-neutral-400 mb-3" />
            <p className="text-sm font-medium text-neutral-700">Click to upload a JSON test file</p>
            <p className="text-xs text-neutral-400 mt-1">Must follow the IELTS Platform JSON format</p>
          </>
        )}
      </div>

      {/* Parsed preview */}
      {parsed && (
        <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
            <span className="text-sm font-medium text-neutral-900">File parsed successfully</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-neutral-500">Title:</span>{' '}<span className="font-medium text-neutral-900">{parsed.title}</span></div>
            <div><span className="text-neutral-500">Type:</span>{' '}<span className="font-medium text-neutral-900 capitalize">{parsed.type}</span></div>
            <div><span className="text-neutral-500">Sections:</span>{' '}<span className="font-medium text-neutral-900">{parsed.sections.length}</span></div>
            <div><span className="text-neutral-500">Questions:</span>{' '}<span className="font-medium text-neutral-900">{totalQuestions}</span></div>
            <div><span className="text-neutral-500">Duration:</span>{' '}<span className="font-medium text-neutral-900">{parsed.time_limit_minutes} min</span></div>
            <div><span className="text-neutral-500">Difficulty:</span>{' '}<span className="font-medium text-neutral-900 capitalize">{parsed.difficulty}</span></div>
          </div>
        </div>
      )}

      {/* Warnings (partial success) */}
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

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* JSON format reference */}
      {!parsed && (
        <details className="text-xs text-neutral-400 cursor-pointer">
          <summary className="hover:text-neutral-600">Show expected JSON format &amp; question types</summary>
          <div className="mt-2 space-y-3">

            {/* Question type reference */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-neutral-600">
              <p className="font-semibold text-neutral-700 mb-1">Supported question types</p>
              <p className="font-medium mt-1 text-neutral-500">Reading</p>
              <ul className="list-disc list-inside space-y-0.5 ml-1">
                <li><code className="bg-neutral-100 px-1 rounded">multiple_choice</code> — A-D multiple choice</li>
                <li><code className="bg-neutral-100 px-1 rounded">true_false_ng</code> — True / False / Not Given</li>
                <li><code className="bg-neutral-100 px-1 rounded">yes_no_ng</code> — Yes / No / Not Given</li>
                <li><code className="bg-neutral-100 px-1 rounded">matching_headings</code> — match headings to paragraphs</li>
                <li><code className="bg-neutral-100 px-1 rounded">matching_information</code> — match info to paragraphs</li>
                <li><code className="bg-neutral-100 px-1 rounded">matching_features</code> — match features to items</li>
                <li><code className="bg-neutral-100 px-1 rounded">matching_sentence_endings</code> — complete sentence halves</li>
                <li><code className="bg-neutral-100 px-1 rounded">sentence_completion</code> — fill words from passage</li>
                <li><code className="bg-neutral-100 px-1 rounded">summary_completion</code> — fill summary blanks</li>
                <li><code className="bg-neutral-100 px-1 rounded">note_table_flowchart_completion</code> — notes / table / flowchart</li>
                <li><code className="bg-neutral-100 px-1 rounded">diagram_label</code> — label a diagram</li>
                <li><code className="bg-neutral-100 px-1 rounded">short_answer</code> — brief free-text answer</li>
              </ul>
              <p className="font-medium mt-2 text-neutral-500">Listening</p>
              <ul className="list-disc list-inside space-y-0.5 ml-1">
                <li><code className="bg-neutral-100 px-1 rounded">multiple_choice</code> — same as Reading</li>
                <li><code className="bg-neutral-100 px-1 rounded">matching</code> — match from a printed list</li>
                <li><code className="bg-neutral-100 px-1 rounded">list_selection</code> — select multiple from A–H list</li>
                <li><code className="bg-neutral-100 px-1 rounded">diagram_label</code> — map / plan / diagram</li>
                <li><code className="bg-neutral-100 px-1 rounded">note_table_flowchart_completion</code> — form / note / table</li>
                <li><code className="bg-neutral-100 px-1 rounded">sentence_completion</code> — same as Reading</li>
                <li><code className="bg-neutral-100 px-1 rounded">short_answer</code> — same as Reading</li>
              </ul>
            </div>

            {/* Full example */}
            <pre className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 overflow-x-auto text-neutral-700 leading-relaxed">{`{
  "title": "IELTS Academic Reading Test 1",
  "type": "reading",
  "difficulty": "advanced",
  "time_limit_minutes": 60,
  "sections": [
    {
      "title": "Reading Passage 1",
      "instructions": "Questions 1–13. Read the passage and answer.",
      "passage_html": "<p>The passage text goes here...</p>",
      "questions": [

        // ── Matching Headings (match_options = list of headings) ──
        {
          "number": 1,
          "type": "matching_headings",
          "question_text": "Paragraph A",
          "correct_answer": "iii",
          "match_options": [
            "i. The origin of the problem",
            "ii. Early solutions",
            "iii. A new perspective",
            "iv. Criticism and response",
            "v. Future implications"
          ]
        },

        // ── True / False / Not Given ──
        {
          "number": 2,
          "type": "true_false_ng",
          "question_text": "The author believes early intervention is always effective.",
          "correct_answer": "False"
        },

        // ── Yes / No / Not Given ──
        {
          "number": 3,
          "type": "yes_no_ng",
          "question_text": "Carbon emissions peaked in 2015.",
          "correct_answer": "Not Given"
        },

        // ── Multiple Choice ──
        {
          "number": 4,
          "type": "multiple_choice",
          "question_text": "What does the writer suggest in paragraph 3?",
          "options": [
            "Costs will continue to rise",
            "New technology will solve the issue",
            "Governments must act immediately",
            "Public opinion is divided"
          ],
          "correct_answer": "B"
        },

        // ── Matching Information ──
        {
          "number": 5,
          "type": "matching_information",
          "question_text": "A reference to an unexpected finding",
          "correct_answer": "C",
          "match_options": ["A", "B", "C", "D", "E"]
        },

        // ── Sentence Completion ──
        {
          "number": 6,
          "type": "sentence_completion",
          "question_text": "The scientists concluded that the results were due to ___.",
          "correct_answer": "climate change",
          "acceptable_answers": ["changes in climate"]
        },

        // ── Note / Table / Flow-chart Completion ──
        {
          "number": 7,
          "type": "note_table_flowchart_completion",
          "question_text": "Main cause: ___",
          "correct_answer": "deforestation",
          "acceptable_answers": ["logging", "forest clearance"]
        },

        // ── Diagram Labelling ──
        {
          "number": 8,
          "type": "diagram_label",
          "question_text": "Label the part marked X on the diagram.",
          "correct_answer": "valve",
          "hint": "Refer to Figure 2 in the passage."
        },

        // ── Short Answer ──
        {
          "number": 9,
          "type": "short_answer",
          "question_text": "What year did the company first expand overseas? (ONE word/number)",
          "correct_answer": "1987"
        }
      ]
    },

    // ── Listening section example ──
    {
      "title": "Section 1",
      "instructions": "Questions 1–10. Complete the form below.",
      "questions": [
        {
          "number": 1,
          "type": "note_table_flowchart_completion",
          "question_text": "Customer name: ___",
          "correct_answer": "Harrison",
          "acceptable_answers": ["harrison"]
        },
        {
          "number": 2,
          "type": "matching",
          "question_text": "Which activity does the speaker choose?",
          "correct_answer": "B",
          "match_options": ["A. Cycling", "B. Swimming", "C. Running", "D. Yoga"]
        }
      ]
    },

    // ── question_groups example (shared options / image across a group) ──
    {
      "title": "Reading Passage 2",
      "question_groups": [

        // Group with shared match_options (matching_information)
        {
          "instructions": "Questions 14–17. Which paragraph contains the following information?",
          "match_options": ["A", "B", "C", "D", "E", "F"],
          "questions": [
            { "number": 14, "type": "matching_information",
              "question_text": "A reference to an unexpected finding",
              "correct_answer": "C" },
            { "number": 15, "type": "matching_information",
              "question_text": "An example of a failed policy",
              "correct_answer": "A" }
          ]
        },

        // Group with shared word_bank (summary completion with word box)
        {
          "instructions": "Questions 18–22. Complete the summary. Choose ONE WORD from the box.",
          "word_bank": ["innovation", "research", "funding", "decline", "growth"],
          "questions": [
            { "number": 18, "type": "summary_completion",
              "question_text": "Scientists relied on government ___ for their work.",
              "correct_answer": "funding" },
            { "number": 19, "type": "summary_completion",
              "question_text": "Early results showed a period of rapid ___.",
              "correct_answer": "growth" }
          ]
        },

        // Group with shared image (diagram labelling)
        {
          "instructions": "Questions 23–26. Label the diagram.",
          "image_url": "https://your-storage.supabase.co/diagrams/figure1.png",
          "questions": [
            { "number": 23, "type": "diagram_label",
              "question_text": "Part A", "correct_answer": "valve" },
            { "number": 24, "type": "diagram_label",
              "question_text": "Part B", "correct_answer": "pump" }
          ]
        }
      ]
    }
  ]
}`}</pre>
          </div>
        </details>
      )}

      <Button type="submit" disabled={!parsed || loading} loading={loading} className="w-full">
        Create Test
      </Button>
    </form>
  )
}
