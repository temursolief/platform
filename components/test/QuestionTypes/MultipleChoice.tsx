'use client'

import type { Question } from '@/lib/types'

interface MultipleChoiceProps {
  question: Question
  value: string
  onChange: (value: string) => void
  showResult?: boolean
}

export function MultipleChoice({ question, value, onChange, showResult }: MultipleChoiceProps) {
  const options = question.options || []

  return (
    <div className="space-y-2">
      {options.map((option) => {
        const isSelected = value === option.label
        const isCorrect = showResult && option.is_correct
        const isWrong = showResult && isSelected && !option.is_correct

        return (
          <label
            key={option.id}
            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
              isCorrect
                ? 'border-emerald-300 bg-emerald-50'
                : isWrong
                ? 'border-red-300 bg-red-50'
                : isSelected
                ? 'border-neutral-900 bg-neutral-50'
                : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
            }`}
          >
            <input
              type="radio"
              name={`q-${question.id}`}
              value={option.label}
              checked={isSelected}
              onChange={() => onChange(option.label)}
              disabled={showResult}
              className="mt-0.5 accent-neutral-900"
            />
            <span className="text-sm text-neutral-800">
              <span className="font-medium">{option.label}.</span> {option.option_text}
            </span>
          </label>
        )
      })}
    </div>
  )
}
