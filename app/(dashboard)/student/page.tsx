import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { ProgressChart } from '@/components/dashboard/ProgressChart'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, BarChart2, Clock, Target } from 'lucide-react'
import { formatBandScore, formatDate } from '@/lib/utils/format'
import { formatDuration } from '@/lib/utils/time'

export default async function StudentDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  // Check teacher role — redirect
  if (profile?.role === 'teacher') redirect('/teacher')

  // Fetch recent attempts with test info
  const { data: attempts } = await supabase
    .from('attempts')
    .select(`*, tests(title, type)`)
    .eq('student_id', user.id)
    .eq('is_completed', true)
    .order('submitted_at', { ascending: false })
    .limit(10)

  const totalAttempts = attempts?.length ?? 0
  const avgBand = attempts?.length
    ? (attempts.reduce((sum, a) => sum + (a.band_score ?? 0), 0) / attempts.length)
    : null
  const bestBand = attempts?.length
    ? Math.max(...attempts.map((a) => a.band_score ?? 0))
    : null

  const chartData = (attempts ?? [])
    .filter((a) => a.submitted_at && a.band_score)
    .map((a) => ({
      date: formatDate(a.submitted_at),
      bandScore: a.band_score,
      type: a.tests?.type ?? 'reading',
    }))
    .reverse()

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">
          Welcome back, {profile?.full_name?.split(' ')[0] || 'Student'}
        </h1>
        <p className="text-neutral-500 mt-1">Here&apos;s your progress overview</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Tests Taken"
          value={totalAttempts}
          icon={<BookOpen size={18} className="text-neutral-600" />}
        />
        <StatsCard
          title="Avg Band Score"
          value={avgBand ? formatBandScore(avgBand) : '—'}
          icon={<BarChart2 size={18} className="text-neutral-600" />}
          highlight={!!avgBand}
        />
        <StatsCard
          title="Best Band Score"
          value={bestBand ? formatBandScore(bestBand) : '—'}
          icon={<Target size={18} className="text-neutral-600" />}
        />
        <StatsCard
          title="Total Study Time"
          value={attempts?.length
            ? formatDuration(attempts.reduce((sum, a) => sum + (a.time_taken_seconds ?? 0), 0))
            : '0 min'}
          icon={<Clock size={18} className="text-neutral-600" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Band Score Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressChart data={chartData} height={140} />
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link
                href="/student/tests"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 border border-neutral-200 transition-colors text-sm font-medium text-neutral-800"
              >
                <BookOpen size={18} className="text-neutral-500" />
                Browse All Tests
              </Link>
              <Link
                href="/student/history"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 border border-neutral-200 transition-colors text-sm font-medium text-neutral-800"
              >
                <Clock size={18} className="text-neutral-500" />
                View History
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Attempts */}
      {attempts && attempts.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Recent Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-neutral-100">
              {attempts.slice(0, 5).map((attempt) => (
                <div key={attempt.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-900">
                      {attempt.tests?.title ?? 'Unknown Test'}
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {formatDate(attempt.submitted_at)} · {attempt.raw_score}/{attempt.total_questions} correct
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={attempt.tests?.type === 'listening' ? 'listening' : 'reading'}>
                      {attempt.tests?.type}
                    </Badge>
                    <span className="text-lg font-bold text-neutral-900 tabular-nums">
                      {formatBandScore(attempt.band_score)}
                    </span>
                    <Link
                      href={`/student/tests/${attempt.test_id}/result?attemptId=${attempt.id}`}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Review
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
