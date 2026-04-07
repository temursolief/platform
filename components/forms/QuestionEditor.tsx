'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Select, Textarea } from '@/components/ui/input'
import type { QuestionType } from '@/lib/types'

interface QuestionDraft {
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

export function QuestionEditor({ sectionId, initialOrderNum = 1, onSave, onCancel }: QuestionEditorProps) {
  const [question, setQuestion] = useState<QuestionDraft>({ ...defaultQuestion(), order_num: initialOrderNum })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = (field: keyof QuestionDraft, value: unknown) => {
    setQuestion((q) => ({ ...q, [field]: value }))
  }

  const updateOption = (idx: number, field: 'text' | 'is_correct', value: string | boolean) => {
    setQuestion((q) => {
      const opts = [...q.options]
      opts[idx] = { ...opts[idx], [field]: value }
      // If marking correct, unmark others
      if (field === 'is_correct' && value === true) {
        opts.forEach((o, i) => { if (i !== idx) opts[i] = { ...o, is_correct: false } })
      }
      return { ...q, options: opts }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.question_text || !question.correct_answer) {
      setError('Question text and correct answer are required.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await onSave(question)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  const showOptions = question.type === 'multiple_choice'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Question #"
          type="number"
          value={question.order_num}
          onChange={(e) => update('order_num', parseInt(e.target.value))}
          min={1}
        />
        <Select
          label="Question Type"
          value={question.type}
          onChange={(e) => update('type', e.target.value as QuestionType)}
        >
          <option value="multiple_choice">Multiple Choice</option>
          <option value="true_false_ng">True / False / Not Given</option>
          <option value="fill_blank">Fill in the Blank</option>
          <option value="short_answer">Short Answer</option>
          <option value="matching">Matching</option>
          <option value="sentence_completion">Sentence Completion</option>
          <option value="summary_completion">Summary Completion</option>
          <option value="diagram_label">Diagram Label</option>
          <option value="list_selection">List Selection</option>
        </Select>
      </div>

      <Textarea
        label="Question Text"
        value={question.question_text}
        onChange={(e) => update('question_text', e.target.value)}
        placeholder="Use ___ or [...] to indicate blanks in fill-in questions"
      />

      {/* Multiple Choice Options */}
      {showOptions && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-700">Options</label>
          {question.options.map((opt, idx) => (
            <div key={opt.label} className="flex items-center gap-2">
              <input
                type="radio"
                name="correct-option"
                checked={opt.is_correct}
                onChange={() => updateOption(idx, 'is_correct', true)}
                title="Mark as correct"
                className="accent-neutral-900"
              />
              <span className="text-sm font-medium text-neutral-500 w-4">{opt.label}.</span>
              <Input
                placeholder={`Option ${opt.label}`}
                value={opt.text}
                onChange={(e) => updateOption(idx, 'text', e.target.value)}
                className="flex-1"
              />
            </div>
          ))}
          <p className="text-xs text-neutral-400">Select the radio button to mark the correct option</p>
        </div>
      )}

      {!showOptions && (
        <Input
          label="Correct Answer"
          value={question.correct_answer}
          onChange={(e) => update('correct_answer', e.target.value)}
          placeholder="Primary correct answer"
        />
      )}

      {showOptions && (
        <Input
          label="Correct Answer (letter)"
          value={question.correct_answer}
          onChange={(e) => update('correct_answer', e.target.value)}
          placeholder="A, B, C, or D"
        />
      )}

      <Input
        label="Acceptable Alternatives (comma-separated)"
        value={question.acceptable_answers}
        onChange={(e) => update('acceptable_answers', e.target.value)}
        placeholder="e.g., smith, John Smith"
        hint="Optional: other valid answers"
      />

      <Input
        label="Hint (optional)"
        value={question.hint}
        onChange={(e) => update('hint', e.target.value)}
        placeholder="Visible to students during the test"
      />

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

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
