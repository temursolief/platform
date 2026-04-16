'use client'

import type { Question } from '@/lib/types'
import { MultipleChoice } from './QuestionTypes/MultipleChoice'
import { TrueFalseNG } from './QuestionTypes/TrueFalseNG'
import { FillBlank } from './QuestionTypes/FillBlank'
import { Matching } from './QuestionTypes/Matching'
import { DragDropBlank } from './QuestionTypes/DragDropBlank'
import { CheckCircle2, XCircle } from 'lucide-react'

const DRAG_DROP_TYPES = new Set([
  'summary_completion',
  'sentence_completion',
  'note_table_flowchart_completion',
  'fill_blank',
])

interface QuestionCardProps {
  question: Question
  value: string
  onChange: (value: string) => void
  showResult?: boolean
  isCorrect?: boolean
  matchOptions?: string[]
  /** Pass all current answers so word-bank tiles can show "used" state */
  allAnswers?: Record<string, string>
}

export function QuestionCard({
  question,
  value,
  onChange,
  showResult,
  isCorrect,
  matchOptions,
  allAnswers,
}: QuestionCardProps) {
  const hasWordBank = (question.options?.length ?? 0) > 0

  const renderInput = () => {
    // Drag-and-drop for completion types that have a word bank
    if (DRAG_DROP_TYPES.has(question.type) && hasWordBank) {
      return (
        <DragDropBlank
          question={question}
          value={value}
          onChange={onChange}
          showResult={showResult}
          isCorrect={isCorrect}
          allAnswers={allAnswers}
        />
      )
    }

    switch (question.type) {
      case 'multiple_choice':
        return (
          <MultipleChoice
            question={question}
            value={value}
            onChange={onChange}
            showResult={showResult}
          />
        )
      case 'true_false_ng':
      case 'yes_no_ng':
        return (
          <TrueFalseNG
            question={question}
            value={value}
            onChange={onChange}
            showResult={showResult}
          />
        )
      case 'fill_blank':
      case 'sentence_completion':
      case 'summary_completion':
      case 'note_table_flowchart_completion':
      case 'short_answer':
      case 'diagram_label':
        return (
          <FillBlank
            question={question}
            value={value}
            onChange={onChange}
            showResult={showResult}
            isCorrect={isCorrect}
          />
        )
      case 'matching':
      case 'matching_headings':
      case 'matching_information':
      case 'matching_features':
      case 'matching_sentence_endings':
      case 'list_selection':
        return (
          <Matching
            question={question}
            value={value}
            onChange={onChange}
            showResult={showResult}
            isCorrect={isCorrect}
            matchOptions={matchOptions}
          />
        )
      default:
        return (
          <FillBlank
            question={question}
            value={value}
            onChange={onChange}
            showResult={showResult}
            isCorrect={isCorrect}
          />
        )
    }
  }

  // For drag-and-drop types, the DragDropBlank renders the question text itself
  const isDragDrop = DRAG_DROP_TYPES.has(question.type) && hasWordBank

  return (
    <div
      data-question-id={question.id}
      className={`p-4 rounded-xl border transition-colors ${
        showResult
          ? isCorrect
            ? 'border-emerald-200 bg-emerald-50/30'
            : 'border-red-200 bg-red-50/30'
          : value
          ? 'border-neutral-300 bg-white'
          : 'border-neutral-200 bg-white'
      }`}
    >
      {/* Question number + text (omit question_text for drag-drop — DragDropBlank renders it inline) */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <span className="text-sm font-semibold text-neutral-400 mt-0.5 flex-shrink-0 tabular-nums">
            {question.order_num}.
          </span>
          {!isDragDrop && (
            <p className="question-text text-neutral-900 text-sm leading-relaxed">
              {question.question_text}
            </p>
          )}
        </div>

        {showResult && (
          <div className="flex-shrink-0 mt-0.5">
            {isCorrect
              ? <CheckCircle2 size={17} className="text-emerald-600" />
              : <XCircle size={17} className="text-red-500" />
            }
          </div>
        )}
      </div>

      {/* Question image (diagram, map, plan) */}
      {question.image_url && (
        <div className="mb-3">
          <img
            src={question.image_url}
            alt="Diagram"
            className="max-w-full rounded-lg border border-neutral-200 object-contain max-h-72"
          />
        </div>
      )}

      {/* Answer input */}
      {renderInput()}

      {/* Hint */}
      {question.hint && !showResult && (
        <p className="text-xs text-neutral-400 mt-2 italic">Hint: {question.hint}</p>
      )}
    </div>
  )
}
