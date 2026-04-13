import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ChevronLeft, Users, BarChart2, Clock, CheckCircle2 } from 'lucide-react'
import { formatBandScore, formatDate, formatScore } from '@/lib/utils/format'
import { formatDuration } from '@/lib/utils/time'
import { getBandColor } from '@/lib/scoring/band-tables'

interface PageProps {
  params: Promise<{ testId: string }>
}

export default async function TestAnalyticsPage({ params }: PageProps) {
  const { testId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Test (ownership verified) and attempts are independent — fetch in parallel
  const [{ data: test }, { data: attempts }] = await Promise.all([
    supabase
      .from('tests')
      .select('*, sections(*, questions(*))')
      .eq('id', testId)
      .eq('teacher_id', user.id)
      .single(),
    supabase
      .from('attempts')
      .select('id, student_id, submitted_at, raw_score, total_questions, band_score, time_taken_seconds, users(full_name, email)')
      .eq('test_id', testId)
      .eq('is_completed', true)
      .order('submitted_at', { ascending: false })
      .limit(500),
  ])

  if (!test) notFound()

  const attemptIds = (attempts ?? []).map((a) => a.id)
  const { data: answers } = attemptIds.length
    ? await supabase
        .from('answers')
        .select('question_id, is_correct, attempt_id')
        .in('attempt_id', attemptIds)
    : { data: [] }

  // Per-question stats
  const allQuestions = (test.sections ?? [])
    .sort((a: { order_num: number }, b: { order_num: number }) => a.order_num - b.order_num)
    .flatMap((s: { questions: { id: string; order_num: number; question_text: string }[] }) => s.questions)

  interface QuestionStat { id: string; order_num: number; question_text: string; correct: number; total: number; rate: number | null }
  const questionStats: QuestionStat[] = allQuestions.map((q: { id: string; order_num: number; question_text: string }) => {
    const qAnswers = (answers ?? []).filter((a) => a.question_id === q.id)
    const correct = qAnswers.filter((a) => a.is_correct).length
    const total = qAnswers.length
    return {
      id: q.id,
      order_num: q.order_num,
      question_text: q.question_text,
      correct,
      total,
      rate: total ? Math.round((correct / total) * 100) : null,
    }
  })

  const totalAttempts = attempts?.length ?? 0
  const avgBand = totalAttempts
    ? attempts!.reduce((s, a) => s + (a.band_score ?? 0), 0) / totalAttempts
    : null
  const avgTime = totalAttempts
    ? Math.round(attempts!.reduce((s, a) => s + (a.time_taken_seconds ?? 0), 0) / totalAttempts)
    : null
  const avgScore = totalAttempts
    ? Math.round(attempts!.reduce((s, a) => s + (a.raw_score ?? 0), 0) / totalAttempts)
    : null

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/teacher/tests/${testId}`}
          className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900 mb-4"
        >
          <ChevronLeft size={16} /> Back to Test
        </Link>
        <h1 className="text-2xl font-bold text-neutral-900">{test.title}</h1>
        <p className="text-neutral-500 mt-1">Analytics & Student Performance</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="text-center">
          <div className="flex items-center justify-center mb-2">
            <Users size={20} className="text-neutral-500" />
          </div>
          <p className="text-3xl font-bold text-neutral-900">{totalAttempts}</p>
          <p className="text-xs text-neutral-500 mt-1">Attempts</p>
        </Card>
        <Card className="text-center">
          <div className="flex items-center justify-center mb-2">
            <BarChart2 size={20} className="text-neutral-500" />
          </div>
          <p className="text-3xl font-bold text-neutral-900">
            {avgBand ? formatBandScore(avgBand) : '—'}
          </p>
          <p className="text-xs text-neutral-500 mt-1">Avg Band Score</p>
        </Card>
        <Card className="text-center">
          <div className="flex items-center justify-center mb-2">
            <CheckCircle2 size={20} className="text-neutral-500" />
          </div>
          <p className="text-3xl font-bold text-neutral-900">
            {avgScore !== null ? `${avgScore}/${test.total_questions}` : '—'}
          </p>
          <p className="text-xs text-neutral-500 mt-1">Avg Raw Score</p>
        </Card>
        <Card className="text-center">
          <div className="flex items-center justify-center mb-2">
            <Clock size={20} className="text-neutral-500" />
          </div>
          <p className="text-3xl font-bold text-neutral-900">
            {avgTime ? formatDuration(avgTime) : '—'}
          </p>
          <p className="text-xs text-neutral-500 mt-1">Avg Time Taken</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Student Attempts */}
        <Card>
          <CardHeader>
            <CardTitle>Student Results</CardTitle>
          </CardHeader>
          <CardContent>
            {!totalAttempts ? (
              <p className="text-sm text-neutral-400 text-center py-4">No attempts yet</p>
            ) : (
              <div className="divide-y divide-neutral-100">
                {attempts!.map((attempt) => (
                  <div key={attempt.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-medium text-neutral-600">
                        {attempt.users?.full_name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-900">
                          {attempt.users?.full_name || attempt.users?.email || 'Unknown'}
                        </p>
                        <p className="text-xs text-neutral-400">
                          {formatDate(attempt.submitted_at)} · {formatScore(attempt.raw_score, attempt.total_questions)}
                        </p>
                      </div>
                    </div>
                    <span className={`text-lg font-bold tabular-nums ${getBandColor(attempt.band_score ?? 0)}`}>
                      {formatBandScore(attempt.band_score)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Question difficulty */}
        <Card>
          <CardHeader>
            <CardTitle>Question Difficulty</CardTitle>
          </CardHeader>
          <CardContent>
            {!totalAttempts ? (
              <p className="text-sm text-neutral-400 text-center py-4">No data yet</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {questionStats.map((qs) => (
                  <div key={qs.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-neutral-600 truncate max-w-[200px]">
                        Q{qs.order_num}. {qs.question_text.substring(0, 40)}{qs.question_text.length > 40 ? '…' : ''}
                      </span>
                      <span className="text-xs font-medium text-neutral-700 flex-shrink-0 ml-2">
                        {qs.rate !== null ? `${qs.rate}%` : '—'}
                      </span>
                    </div>
                    <Progress
                      value={qs.rate ?? 0}
                      color={
                        (qs.rate ?? 0) >= 70 ? 'success' :
                        (qs.rate ?? 0) >= 40 ? 'warning' : 'danger'
                      }
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Band Distribution */}
      {totalAttempts > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Band Score Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3 h-32">
              {[4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9].map((band) => {
                const count = attempts!.filter((a) => a.band_score === band).length
                const height = totalAttempts ? Math.max((count / totalAttempts) * 100, count > 0 ? 8 : 0) : 0
                return (
                  <div key={band} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-neutral-500">{count > 0 ? count : ''}</span>
                    <div
                      className="w-full bg-neutral-900 rounded-t transition-all"
                      style={{ height: `${height}%`, minHeight: count > 0 ? '4px' : '0' }}
                      title={`Band ${band}: ${count} student(s)`}
                    />
                    <span className="text-xs text-neutral-400">{band}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
