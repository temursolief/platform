import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProgressChart } from '@/components/dashboard/ProgressChart'
import { formatBandScore, formatDate, formatScore } from '@/lib/utils/format'
import { formatDuration } from '@/lib/utils/time'
import { getBandDescriptor, getBandColor } from '@/lib/scoring/band-tables'
import { Clock, BookOpen } from 'lucide-react'

export default async function StudentHistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: attempts } = await supabase
    .from('attempts')
    .select('*, tests(id, title, type)')
    .eq('student_id', user.id)
    .eq('is_completed', true)
    .order('submitted_at', { ascending: false })

  const chartData = (attempts ?? [])
    .filter((a) => a.submitted_at && a.band_score)
    .map((a) => ({
      date: formatDate(a.submitted_at),
      bandScore: a.band_score,
      type: a.tests?.type ?? 'reading',
    }))
    .reverse()

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">Test History</h1>
        <p className="text-neutral-500 mt-1">{attempts?.length ?? 0} completed tests</p>
      </div>

      {/* Progress Chart */}
      {chartData.length > 1 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Band Score Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressChart data={chartData} height={160} />
          </CardContent>
        </Card>
      )}

      {/* Attempts List */}
      {!attempts?.length ? (
        <div className="text-center py-16 text-neutral-400">
          <BookOpen size={40} className="mx-auto mb-4 opacity-40" />
          <p>You haven&apos;t completed any tests yet.</p>
          <Link href="/student/tests" className="text-sm text-blue-600 mt-2 block hover:underline">
            Browse available tests
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {attempts.map((attempt) => {
            const bandColor = getBandColor(attempt.band_score ?? 0)
            return (
              <Card key={attempt.id} hoverable>
                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-neutral-900 truncate">
                        {attempt.tests?.title ?? 'Unknown Test'}
                      </h3>
                      <Badge variant={attempt.tests?.type === 'listening' ? 'listening' : 'reading'}>
                        {attempt.tests?.type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-neutral-500">
                      <span>{formatDate(attempt.submitted_at)}</span>
                      <span>·</span>
                      <span>{formatScore(attempt.raw_score, attempt.total_questions)} correct</span>
                      {attempt.time_taken_seconds && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Clock size={11} />
                            {formatDuration(attempt.time_taken_seconds)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className={`text-2xl font-bold ${bandColor} tabular-nums`}>
                      {formatBandScore(attempt.band_score)}
                    </p>
                    <p className="text-xs text-neutral-400">
                      {getBandDescriptor(attempt.band_score ?? 0)}
                    </p>
                  </div>

                  <Link
                    href={`/student/tests/${attempt.test_id}/result?attemptId=${attempt.id}`}
                    className="text-xs text-blue-600 hover:underline flex-shrink-0"
                  >
                    Review
                  </Link>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
