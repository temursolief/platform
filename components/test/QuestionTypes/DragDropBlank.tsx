'use client'

import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
import type { Question } from '@/lib/types'

interface DragDropBlankProps {
  question: Question
  value: string
  onChange: (value: string) => void
  showResult?: boolean
  isCorrect?: boolean
  /** All current answers keyed by question id — used to mark "used" tiles */
  allAnswers?: Record<string, string>
}

/**
 * Drag-and-drop word bank for summary/sentence completion questions.
 * The question text may contain ___ markers (blank) or not.
 * If it contains a blank, render the inline blank as a drop zone.
 * Word tiles come from question.options[].
 */
export function DragDropBlank({
  question,
  value,
  onChange,
  showResult,
  isCorrect,
  allAnswers = {},
}: DragDropBlankProps) {
  const [dragOver, setDragOver] = useState(false)
  const [draggingWord, setDraggingWord] = useState<string | null>(null)

  const wordBank = question.options ?? []

  // Words used by OTHER questions in the same section (passed via allAnswers)
  const usedElsewhere = new Set(
    Object.entries(allAnswers)
      .filter(([qid]) => qid !== question.id)
      .map(([, v]) => v)
      .filter(Boolean)
  )

  const handleDragStart = (word: string) => {
    setDraggingWord(word)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const word = e.dataTransfer.getData('text/plain') || draggingWord
    if (word) onChange(word)
    setDraggingWord(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => setDragOver(false)

  const clearAnswer = () => onChange('')

  // Split question text around blank markers
  const BLANK_RE = /(_+|\[\.{3}\]|\[___\])/
  const parts = question.question_text.split(BLANK_RE)
  const hasInlineBlank = parts.length > 1

  const dropZoneClass = `drop-zone${dragOver ? ' drag-over' : ''}${value ? ' filled' : ''}`

  const DropZone = (
    <span
      className={dropZoneClass}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {value || <span className="text-neutral-400 text-xs">drop here</span>}
    </span>
  )

  return (
    <div className="space-y-3">
      {/* Question text with inline drop zone or standalone drop zone */}
      <div className="text-sm text-neutral-800 leading-relaxed select-text">
        {hasInlineBlank ? (
          <span>
            {parts.map((part, i) =>
              BLANK_RE.test(part) ? (
                <span key={i} className="inline-block mx-1">{DropZone}</span>
              ) : (
                <span key={i}>{part}</span>
              )
            )}
          </span>
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            <span>{question.question_text}</span>
            {DropZone}
          </div>
        )}
      </div>

      {/* Word bank */}
      {!showResult && (
        <div className="flex flex-wrap gap-2 pt-1">
          {wordBank.map((opt) => {
            const isUsedHere = value === opt.option_text
            const isUsedElsewhere = usedElsewhere.has(opt.option_text)
            const tileClass = `word-tile${isUsedHere || isUsedElsewhere ? ' used' : ''}`
            return (
              <span
                key={opt.id}
                draggable={!isUsedHere}
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', opt.option_text)
                  handleDragStart(opt.option_text)
                  e.currentTarget.classList.add('dragging')
                }}
                onDragEnd={(e) => {
                  e.currentTarget.classList.remove('dragging')
                  setDraggingWord(null)
                }}
                onClick={() => {
                  if (!isUsedHere) onChange(opt.option_text)
                  else clearAnswer()
                }}
                title={isUsedHere ? 'Click to remove' : `Click or drag to use "${opt.option_text}"`}
                className={tileClass}
              >
                {opt.option_text}
              </span>
            )
          })}

          {/* Clear button if something is filled */}
          {value && (
            <button
              type="button"
              onClick={clearAnswer}
              className="flex items-center gap-1 text-xs text-neutral-400 hover:text-red-500 transition-colors ml-1"
              title="Clear answer"
            >
              <RotateCcw size={11} />
              clear
            </button>
          )}
        </div>
      )}

      {/* Result feedback */}
      {showResult && !isCorrect && (
        <p className="text-xs text-emerald-600">
          Correct answer: <span className="font-medium">{question.correct_answer}</span>
        </p>
      )}
    </div>
  )
}
