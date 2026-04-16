'use client'

import { CheckCircle2, XCircle, Clock } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { QuestionCard } from '@/components/test/QuestionCard'
import type { Question } from '@/lib/types'

interface AnswerRow {
  question_id: string
  given_answer: string | null
  is_correct: boolean | null
}

interface SectionRow {
  id: string
  title: string | null
  order_num: number
  questions: Question[]
}

interface ResultReviewProps {
  sections: SectionRow[]
  answers: AnswerRow[]
  /** ms spent per question, keyed by question ID. May be absent for older attempts. */
  questionTimings?: Record<string, number> | null
}

function formatMs(ms: number): string {
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  const rem = s % 60
  return rem > 0 ? `${m}m ${rem}s` : `${m}m`
}

export function ResultReview({ sections, answers, questionTimings }: ResultReviewProps) {
  const answersMap = new Map(answers.map((a) => [a.question_id, a]))

  return (
    <div className="space-y-6">
      {sections.map((section, si) => {
        const correct = section.questions.filter((q) => answersMap.get(q.id)?.is_correct).length
        const wrong = section.questions.length - correct

        return (
          <Card key={section.id ?? `section-${si}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{section.title || `Section ${section.order_num}`}</CardTitle>
                <div className="flex gap-3 text-sm">
                  <span className="flex items-center gap-1 text-emerald-600">
                    <CheckCircle2 size={14} />
                    {correct} correct
                  </span>
                  <span className="flex items-center gap-1 text-red-600">
                    <XCircle size={14} />
                    {wrong} wrong
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {section.questions.map((question, qi) => {
                  const ans = answersMap.get(question.id)
                  const timeMs = questionTimings?.[question.id]

                  return (
                    <div key={question.id ?? `q-${si}-${qi}`}>
                      <QuestionCard
                        question={question}
                        value={ans?.given_answer ?? ''}
                        onChange={() => {}}
                        showResult={true}
                        isCorrect={ans?.is_correct ?? false}
                        matchOptions={question.options?.map((o) => o.option_text) ?? []}
                      />
                      {timeMs != null && (
                        <div className="flex items-center gap-1 mt-1.5 text-xs text-neutral-400 justify-end">
                          <Clock size={11} />
                          <span>{formatMs(timeMs)} spent on this question</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
