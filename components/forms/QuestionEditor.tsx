'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input, Select, Textarea } from '@/components/ui/input'
import type { QuestionType } from '@/lib/types'

export interface QuestionDraft {
  order_num: number
  type: QuestionType
  question_text: string
  correct_answer: string
  acceptable_answers: string
  hint: string
  options: { label: string; text: string; is_correct: boolean }[]
}

const defaultQuestion = (): QuestionDraft => ({
  order_num: 1,
  type: 'multiple_choice',
  question_text: '',
  correct_answer: '',
  acceptable_answers: '',
  hint: '',
  options: [
    { label: 'A', text: '', is_correct: false },
    { label: 'B', text: '', is_correct: false },
    { label: 'C', text: '', is_correct: false },
    { label: 'D', text: '', is_correct: false },
  ],
})

interface QuestionEditorProps {
  sectionId: string
  initialOrderNum?: number
  onSave: (question: QuestionDraft) => Promise<void>
  onCancel?: () => void
}

export function QuestionEditor({
  sectionId: _sectionId,
  initialOrderNum = 1,
  onSave,
  onCancel,
}: QuestionEditorProps) {
  const [question, setQuestion] = useState<QuestionDraft>({
    ...defaultQuestion(),
    order_num: initialOrderNum,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = (field: keyof QuestionDraft, value: unknown) => {
    setQuestion((q) => ({ ...q, [field]: value }))
  }

  // Mark an option as correct AND sync the correct_answer letter
  const selectCorrectOption = (idx: number) => {
    setQuestion((q) => {
      const opts = q.options.map((o, i) => ({ ...o, is_correct: i === idx }))
      return { ...q, options: opts, correct_answer: opts[idx].label }
    })
  }

  const updateOptionText = (idx: number, text: string) => {
    setQuestion((q) => {
      const opts = [...q.options]
      opts[idx] = { ...opts[idx], text }
      return { ...q, options: opts }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!question.question_text.trim()) {
      setError('Question text is required.')
      return
    }

    // For MC, correct_answer is auto-populated from the radio selection
    const isMultipleChoice = question.type === 'multiple_choice'
    const isTFNG = question.type === 'true_false_ng' || question.type === 'yes_no_ng'
    if (!question.correct_answer.trim()) {
      if (isMultipleChoice) {
        setError('Select the correct option by clicking its radio button.')
      } else if (isTFNG) {
        setError('Select the correct answer (True/False/Not Given or Yes/No/Not Given).')
      } else {
        setError('Correct answer is required.')
      }
      return
    }

    // For MC, ensure at least the option texts are filled in
    if (isMultipleChoice) {
      const emptyOptions = question.options.filter((o) => !o.text.trim())
      if (emptyOptions.length > 0) {
        setError(`Fill in all option texts (${emptyOptions.map((o) => o.label).join(', ')} are empty).`)
        return
      }
    }

    setLoading(true)
    try {
      await onSave(question)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save question.')
    } finally {
      setLoading(false)
    }
  }

  const isMultipleChoice = question.type === 'multiple_choice'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Row 1: order + type */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Question #"
          type="number"
          value={question.order_num}
          onChange={(e) => update('order_num', parseInt(e.target.value) || 1)}
          min={1}
        />
        <Select
          label="Question Type"
          value={question.type}
          onChange={(e) => {
            update('type', e.target.value as QuestionType)
            // Reset correct_answer when switching away from MC
            if (e.target.value !== 'multiple_choice') {
              update('correct_answer', '')
            }
          }}
        >
          <optgroup label="── Reading ──────────────────">
            <option value="multiple_choice">Multiple Choice</option>
            <option value="true_false_ng">True / False / Not Given</option>
            <option value="yes_no_ng">Yes / No / Not Given</option>
            <option value="matching_headings">Matching Headings</option>
            <option value="matching_information">Matching Information</option>
            <option value="matching_features">Matching Features</option>
            <option value="matching_sentence_endings">Matching Sentence Endings</option>
            <option value="sentence_completion">Sentence Completion</option>
            <option value="summary_completion">Summary Completion</option>
            <option value="note_table_flowchart_completion">Note / Table / Flow-chart Completion</option>
            <option value="diagram_label">Diagram Labelling</option>
            <option value="short_answer">Short-answer Questions</option>
          </optgroup>
          <optgroup label="── Listening ────────────────">
            <option value="matching">Matching (Listening)</option>
            <option value="list_selection">List Selection</option>
          </optgroup>
          <optgroup label="── General ──────────────────">
            <option value="fill_blank">Fill in the Blank (generic)</option>
          </optgroup>
        </Select>
      </div>

      {/* Question text */}
      <Textarea
        label="Question Text"
        value={question.question_text}
        onChange={(e) => update('question_text', e.target.value)}
        placeholder={
          question.type === 'fill_blank' || question.type === 'sentence_completion'
            ? 'Use ___ to indicate the blank, e.g. "The building was built in ___."'
            : 'Enter the question text...'
        }
      />

      {/* Multiple Choice options */}
      {isMultipleChoice && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-700">
            Options <span className="text-neutral-400 font-normal">(click the circle to mark correct)</span>
          </label>
          {question.options.map((opt, idx) => (
            <div key={opt.label} className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => selectCorrectOption(idx)}
                className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-colors ${
                  opt.is_correct
                    ? 'border-neutral-900 bg-neutral-900'
                    : 'border-neutral-300 hover:border-neutral-500'
                }`}
                title={`Mark ${opt.label} as correct`}
              >
                {opt.is_correct && (
                  <span className="block w-2 h-2 rounded-full bg-white mx-auto mt-0.5" />
                )}
              </button>
              <span className="text-sm font-semibold text-neutral-600 w-5 flex-shrink-0">
                {opt.label}
              </span>
              <Input
                placeholder={`Option ${opt.label}`}
                value={opt.text}
                onChange={(e) => updateOptionText(idx, e.target.value)}
                className="flex-1"
              />
            </div>
          ))}
          {question.correct_answer && (
            <p className="text-xs text-emerald-600">
              ✓ Correct answer: Option {question.correct_answer}
            </p>
          )}
        </div>
      )}

      {/* True / False / Not Given quick-select */}
      {(question.type === 'true_false_ng' || question.type === 'yes_no_ng') && (
        <div>
          <label className="text-sm font-medium text-neutral-700 block mb-2">Correct Answer</label>
          <div className="flex gap-2">
            {(question.type === 'yes_no_ng'
              ? ['Yes', 'No', 'Not Given']
              : ['True', 'False', 'Not Given']
            ).map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => update('correct_answer', val)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  question.correct_answer === val
                    ? 'border-neutral-900 bg-neutral-900 text-white'
                    : 'border-neutral-200 text-neutral-700 hover:border-neutral-400'
                }`}
              >
                {val}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Correct answer text field for non-MC, non-TFNG/YNNG types */}
      {!isMultipleChoice && question.type !== 'true_false_ng' && question.type !== 'yes_no_ng' && (
        <Input
          label="Correct Answer"
          value={question.correct_answer}
          onChange={(e) => update('correct_answer', e.target.value)}
          placeholder="Primary accepted answer"
        />
      )}

      {/* Acceptable alternatives */}
      <Input
        label="Acceptable Alternatives"
        value={question.acceptable_answers}
        onChange={(e) => update('acceptable_answers', e.target.value)}
        placeholder="Comma-separated, e.g.  smith, John Smith"
        hint="Optional — other valid spellings or phrasings"
      />

      {/* Hint */}
      <Input
        label="Hint (optional)"
        value={question.hint}
        onChange={(e) => update('hint', e.target.value)}
        placeholder="Shown to students during the test"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" loading={loading} className="flex-1">
          Save Question
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
