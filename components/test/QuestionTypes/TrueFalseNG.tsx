'use client'

import type { Question } from '@/lib/types'

interface TrueFalseNGProps {
  question: Question
  value: string
  onChange: (value: string) => void
  showResult?: boolean
}

const OPTIONS = [
  { label: 'True', value: 'True' },
  { label: 'False', value: 'False' },
  { label: 'Not Given', value: 'Not Given' },
]

export function TrueFalseNG({ question, value, onChange, showResult }: TrueFalseNGProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {OPTIONS.map((option) => {
        const isSelected = value === option.value
        const isCorrect = showResult && question.correct_answer === option.value
        const isWrong = showResult && isSelected && question.correct_answer !== option.value

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => !showResult && onChange(option.value)}
            disabled={showResult}
            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
              isCorrect
                ? 'border-emerald-400 bg-emerald-100 text-emerald-800'
                : isWrong
                ? 'border-red-400 bg-red-100 text-red-800'
                : isSelected
                ? 'border-neutral-900 bg-neutral-900 text-white'
                : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50'
            } ${showResult ? 'cursor-default' : 'cursor-pointer'}`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
