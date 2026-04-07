'use client'

import { useRef } from 'react'
import type { Question } from '@/lib/types'

interface FillBlankProps {
  question: Question
  value: string
  onChange: (value: string) => void
  showResult?: boolean
  isCorrect?: boolean
}

export function FillBlank({ question, value, onChange, showResult, isCorrect }: FillBlankProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  // Parse question text — replace ___ or [...] with input
  const parts = question.question_text.split(/(_+|\[\.{3}\]|\[___\])/)

  const hasBlankInText = parts.length > 1

  if (hasBlankInText) {
    return (
      <div className="flex flex-wrap items-center gap-1 text-neutral-800 text-sm leading-relaxed">
        {parts.map((part, i) => {
          if (/^_+$|^\[\.{3}\]$|^\[___\]$/.test(part)) {
            return (
              <input
                key={i}
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={showResult}
                placeholder="answer"
                className={`blank-input inline-block min-w-[120px] text-center text-sm font-mono ${
                  showResult
                    ? isCorrect
                      ? 'border-emerald-500 text-emerald-700'
                      : 'border-red-500 text-red-700'
                    : 'border-neutral-400 focus:border-neutral-900'
                }`}
              />
            )
          }
          return <span key={i}>{part}</span>
        })}
        {showResult && !isCorrect && (
          <span className="text-xs text-emerald-600 ml-2">
            ({question.correct_answer})
          </span>
        )}
      </div>
    )
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={showResult}
        placeholder="Type your answer..."
        className={`w-full h-10 px-3 rounded-lg border text-sm font-mono transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-900 ${
          showResult
            ? isCorrect
              ? 'border-emerald-400 bg-emerald-50 text-emerald-800'
              : 'border-red-400 bg-red-50 text-red-800'
            : 'border-neutral-200 bg-white'
        }`}
      />
      {showResult && !isCorrect && (
        <p className="text-xs text-emerald-600 mt-1">
          Correct answer: {question.correct_answer}
        </p>
      )}
    </div>
  )
}
