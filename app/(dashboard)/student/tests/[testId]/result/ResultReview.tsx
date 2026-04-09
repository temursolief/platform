'use client'

import { CheckCircle2, XCircle } from 'lucide-react'
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
}

export function ResultReview({ sections, answers }: ResultReviewProps) {
  const answersMap = new Map(answers.map((a) => [a.question_id, a]))

  return (
    <div className="space-y-6">
      {sections.map((section) => {
        const correct = section.questions.filter((q) => answersMap.get(q.id)?.is_correct).length
        const wrong = section.questions.length - correct

        return (
          <Card key={section.id}>
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
              <div className="space-y-3">
                {section.questions.map((question) => {
                  const ans = answersMap.get(question.id)
                  return (
                    <QuestionCard
                      key={question.id}
                      question={question}
                      value={ans?.given_answer ?? ''}
                      onChange={() => {}}
                      showResult={true}
                      isCorrect={ans?.is_correct ?? false}
                      matchOptions={question.options?.map((o) => o.option_text) ?? []}
                    />
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
