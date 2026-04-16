'use client'

import type { SectionWithQuestions } from '@/lib/types'

interface AnswerSheetProps {
  sections: SectionWithQuestions[]
  answers: Record<string, string>
  currentSectionIndex: number
  onSelectSection: (index: number) => void
  layout?: 'side' | 'bottom'
}

export function AnswerSheet({
  sections,
  answers,
  currentSectionIndex,
  onSelectSection,
  layout = 'side',
}: AnswerSheetProps) {
  if (layout === 'bottom') {
    return (
      <div className="flex items-start gap-6 overflow-x-auto pb-1">
        {sections.map((section, sectionIdx) => (
          <div key={section.id} className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => onSelectSection(sectionIdx)}
              className={`text-xs font-semibold whitespace-nowrap px-2 py-1 rounded transition-colors ${
                sectionIdx === currentSectionIndex
                  ? 'text-blue-700 bg-blue-50'
                  : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              {section.title || `Section ${sectionIdx + 1}`}
            </button>
            <div className="flex flex-wrap gap-1">
              {section.questions.map((question) => {
                const isAnswered = !!answers[question.id]?.trim()
                return (
                  <div
                    key={question.id}
                    title={`Q${question.order_num}: ${isAnswered ? 'Answered' : 'Unanswered'}`}
                    className={`h-6 w-6 rounded text-[10px] font-medium flex items-center justify-center flex-shrink-0 transition-colors ${
                      isAnswered
                        ? 'bg-neutral-900 text-white'
                        : 'bg-neutral-100 text-neutral-400 border border-neutral-200'
                    }`}
                  >
                    {question.order_num}
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* Legend */}
        <div className="flex items-center gap-3 flex-shrink-0 ml-auto pl-4 border-l border-neutral-200">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-neutral-900" />
            <span className="text-[10px] text-neutral-500">Done</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-neutral-100 border border-neutral-200" />
            <span className="text-[10px] text-neutral-500">Empty</span>
          </div>
        </div>
      </div>
    )
  }

  // side layout (legacy, kept for reference)
  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-neutral-900 mb-3">Answer Sheet</h3>

      {sections.map((section, sectionIdx) => (
        <div key={section.id} className="mb-4">
          <button
            onClick={() => onSelectSection(sectionIdx)}
            className={`text-xs font-medium mb-2 block w-full text-left px-2 py-1 rounded transition-colors ${
              sectionIdx === currentSectionIndex
                ? 'text-blue-700 bg-blue-50'
                : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            {section.title || `Section ${sectionIdx + 1}`}
          </button>

          <div className="grid grid-cols-4 gap-1">
            {section.questions.map((question) => {
              const isAnswered = !!answers[question.id]?.trim()
              return (
                <div
                  key={question.id}
                  title={`Q${question.order_num}: ${isAnswered ? 'Answered' : 'Unanswered'}`}
                  className={`h-7 w-full rounded text-xs font-medium flex items-center justify-center transition-colors ${
                    isAnswered
                      ? 'bg-neutral-900 text-white'
                      : 'bg-neutral-100 text-neutral-400 border border-neutral-200'
                  }`}
                >
                  {question.order_num}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-neutral-100">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-neutral-900" />
          <span className="text-xs text-neutral-500">Answered</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-neutral-100 border border-neutral-200" />
          <span className="text-xs text-neutral-500">Unanswered</span>
        </div>
      </div>
    </div>
  )
}
