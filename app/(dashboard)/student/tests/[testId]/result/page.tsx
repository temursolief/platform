import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { QuestionCard } from '@/components/test/QuestionCard'
import { getBandDescriptor, getBandColor } from '@/lib/scoring/band-tables'
import { formatBandScore, formatScore } from '@/lib/utils/format'
import { formatDuration } from '@/lib/utils/time'
import { CheckCircle2, XCircle, Clock, ChevronRight } from 'lucide-react'
import type { Question } from '@/lib/types'

interface PageProps {
  params: Promise<{ testId: string }>
  searchParams: Promise<{ attemptId?: string }>
}

export default async function ResultPage({ params, searchParams }: PageProps) {
  const { testId } = await params
  const { attemptId } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  if (!attemptId) notFound()

  // Fetch attempt
  const { data: attempt } = await supabase
    .from('attempts')
    .select('*')
    .eq('id', attemptId)
    .eq('student_id', user.id)
    .single()

  if (!attempt || !attempt.is_completed) notFound()

  // Fetch test with sections/questions
  const { data: test } = await supabase
    .from('tests')
    .select(`*, sections(*, questions(*, options(*)))`)
    .eq('id', testId)
    .single()

  if (!test) notFound()

  // Fetch answers
  const { data: answers } = await supabase
    .from('answers')
    .select('*')
    .eq('attempt_id', attemptId)

  const answersMap = new Map(answers?.map((a) => [a.question_id, a]) ?? [])

  // Sort sections + questions
  test.sections = test.sections
    .sort((a: { order_num: number }, b: { order_num: number }) => a.order_num - b.order_num)
    .map((s: { questions: { order_num: number }[] }) => ({
      ...s,
      questions: s.questions.sort((a: { order_num: number }, b: { order_num: number }) => a.order_num - b.order_num),
    }))

  const bandColor = getBandColor(attempt.band_score ?? 0)

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-neutral-500 mb-3">
          <Link href="/student/tests" className="hover:text-neutral-900">Tests</Link>
          <ChevronRight size={14} />
          <span>{test.title}</span>
          <ChevronRight size={14} />
          <span>Results</span>
        </div>
        <h1 className="text-2xl font-bold text-neutral-900">{test.title}</h1>
        <p className="text-neutral-500 mt-1">Test Results</p>
      </div>

      {/* Score Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="text-center">
          <p className="text-sm text-neutral-500 mb-1">Band Score</p>
          <p className={`text-4xl font-bold ${bandColor}`}>
            {formatBandScore(attempt.band_score)}
          </p>
          <p className="text-xs text-neutral-400 mt-1">
            {getBandDescriptor(attempt.band_score ?? 0)}
          </p>
        </Card>
        <Card className="text-center">
          <p className="text-sm text-neutral-500 mb-1">Score</p>
          <p className="text-3xl font-bold text-neutral-900">
            {formatScore(attempt.raw_score, attempt.total_questions)}
          </p>
          <p className="text-xs text-neutral-400 mt-1">correct answers</p>
        </Card>
        <Card className="text-center">
          <p className="text-sm text-neutral-500 mb-1">Accuracy</p>
          <p className="text-3xl font-bold text-neutral-900">
            {attempt.total_questions
              ? Math.round(((attempt.raw_score ?? 0) / attempt.total_questions) * 100)
              : 0}%
          </p>
          <p className="text-xs text-neutral-400 mt-1">accuracy rate</p>
        </Card>
        <Card className="text-center">
          <p className="text-sm text-neutral-500 mb-1">Time Taken</p>
          <p className="text-3xl font-bold text-neutral-900">
            {attempt.time_taken_seconds ? formatDuration(attempt.time_taken_seconds) : '—'}
          </p>
          <p className="text-xs text-neutral-400 mt-1">
            of {test.time_limit_minutes} min
          </p>
        </Card>
      </div>

      {/* Answer Review */}
      <div className="space-y-6">
        {test.sections.map((section: { id: string; title: string; order_num: number; questions: Question[] }) => (
          <Card key={section.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{section.title || `Section ${section.order_num}`}</CardTitle>
                <div className="flex gap-3 text-sm">
                  <span className="flex items-center gap-1 text-emerald-600">
                    <CheckCircle2 size={14} />
                    {section.questions.filter((q) => answersMap.get(q.id)?.is_correct).length} correct
                  </span>
                  <span className="flex items-center gap-1 text-red-600">
                    <XCircle size={14} />
                    {section.questions.filter((q) => !answersMap.get(q.id)?.is_correct).length} wrong
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
                      value={ans?.given_answer || ''}
                      onChange={() => {}}
                      showResult={true}
                      isCorrect={ans?.is_correct ?? false}
                    />
                  )
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Actions */}
      <div className="mt-8 flex gap-4">
        <Link
          href="/student/tests"
          className="flex-1 text-center bg-neutral-900 text-white py-3 rounded-lg font-medium hover:bg-neutral-800 transition-colors"
        >
          Take Another Test
        </Link>
        <Link
          href="/student"
          className="flex-1 text-center bg-white border border-neutral-200 text-neutral-700 py-3 rounded-lg font-medium hover:bg-neutral-50 transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}
