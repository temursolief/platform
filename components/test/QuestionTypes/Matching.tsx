'use client'

import type { Question } from '@/lib/types'
import { Select } from '@/components/ui/input'

interface MatchingProps {
  question: Question
  value: string
  onChange: (value: string) => void
  showResult?: boolean
  isCorrect?: boolean
  matchOptions?: string[]
}

export function Matching({
  question,
  value,
  onChange,
  showResult,
  isCorrect,
  matchOptions = [],
}: MatchingProps) {
  return (
    <div>
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={showResult}
        className={showResult
          ? isCorrect
            ? 'border-emerald-400 bg-emerald-50'
            : 'border-red-400 bg-red-50'
          : ''
        }
      >
        <option value="">— Select answer —</option>
        {matchOptions.map((opt, i) => (
          <option key={i} value={opt}>
            {opt}
          </option>
        ))}
      </Select>
      {showResult && !isCorrect && (
        <p className="text-xs text-emerald-600 mt-1">
          Correct answer: {question.correct_answer}
        </p>
      )}
    </div>
  )
}
