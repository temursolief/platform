import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Users, BarChart2, Plus, ChevronRight } from 'lucide-react'
import { formatDate, formatBandScore } from '@/lib/utils/format'

export default async function TeacherDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Profile and tests are independent — fetch in parallel
  const [{ data: profile }, { data: tests }] = await Promise.all([
    supabase.from('users').select('role, full_name').eq('id', user.id).single(),
    supabase
      .from('tests')
      .select('id, title, type, is_published, created_at, total_questions')
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100),
  ])

  if (profile?.role === 'student') redirect('/student')

  // Fetch recent attempts on teacher's tests (depends on test IDs from above)
  const testIds = tests?.map((t) => t.id) ?? []
  const { data: attempts } = testIds.length
    ? await supabase
        .from('attempts')
        .select('id, student_id, submitted_at, band_score, users(full_name, email)')
        .in('test_id', testIds)
        .eq('is_completed', true)
        .order('submitted_at', { ascending: false })
        .limit(20)
    : { data: [] }

  const publishedCount = tests?.filter((t) => t.is_published).length ?? 0
  const draftCount = (tests?.length ?? 0) - publishedCount
  const uniqueStudents = new Set(attempts?.map((a) => a.student_id)).size
  const avgBand = attempts?.length
    ? (attempts.reduce((sum, a) => sum + (a.band_score ?? 0), 0) / attempts.length)
    : null

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            Welcome, {profile?.full_name?.split(' ')[0] || 'Teacher'}
          </h1>
          <p className="text-neutral-500 mt-1">Manage your tests and track student progress</p>
        </div>
        <Link
          href="/teacher/tests/new"
          className="flex items-center gap-2 bg-neutral-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors"
        >
          <Plus size={16} />
          New Test
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Published Tests"
          value={publishedCount}
          icon={<BookOpen size={18} className="text-neutral-600" />}
          highlight
        />
        <StatsCard
          title="Draft Tests"
          value={draftCount}
          icon={<BookOpen size={18} className="text-neutral-600" />}
        />
        <StatsCard
          title="Active Students"
          value={uniqueStudents}
          icon={<Users size={18} className="text-neutral-600" />}
        />
        <StatsCard
          title="Avg Band Score"
          value={avgBand ? formatBandScore(avgBand) : '—'}
          icon={<BarChart2 size={18} className="text-neutral-600" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tests Overview */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Your Tests</CardTitle>
              <Link href="/teacher/tests" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                View all <ChevronRight size={12} />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {!tests?.length ? (
              <div className="text-center py-8 text-neutral-400 text-sm">
                <p>No tests yet.</p>
                <Link href="/teacher/tests/new" className="text-blue-600 hover:underline mt-1 block">
                  Create your first test
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100">
                {tests.slice(0, 5).map((test) => (
                  <div key={test.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{test.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant={test.type === 'listening' ? 'listening' : 'reading'}>
                          {test.type}
                        </Badge>
                        <span className="text-xs text-neutral-400">{formatDate(test.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={test.is_published ? 'success' : 'default'}>
                        {test.is_published ? 'Published' : 'Draft'}
                      </Badge>
                      <Link
                        href={`/teacher/tests/${test.id}`}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Attempts</CardTitle>
          </CardHeader>
          <CardContent>
            {!attempts?.length ? (
              <p className="text-sm text-neutral-400 text-center py-4">No attempts yet</p>
            ) : (
              <div className="space-y-3">
                {attempts.slice(0, 6).map((attempt) => (
                  <div key={attempt.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-neutral-800 truncate max-w-[120px]">
                        {attempt.users?.full_name || attempt.users?.email || 'Student'}
                      </p>
                      <p className="text-xs text-neutral-400">{formatDate(attempt.submitted_at)}</p>
                    </div>
                    <span className="text-sm font-bold text-neutral-900">
                      {formatBandScore(attempt.band_score)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
