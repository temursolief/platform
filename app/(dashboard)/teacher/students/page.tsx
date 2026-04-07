import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users } from 'lucide-react'
import { formatDate, formatBandScore } from '@/lib/utils/format'

export default async function TeacherStudentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'student') redirect('/student')

  // Get all tests by this teacher
  const { data: tests } = await supabase
    .from('tests')
    .select('id')
    .eq('teacher_id', user.id)

  const testIds = tests?.map((t) => t.id) ?? []

  // Get all completed attempts on these tests, with student info
  const { data: attempts } = await supabase
    .from('attempts')
    .select('*, users(id, full_name, email, avatar_url, created_at), tests(title, type)')
    .in('test_id', testIds.length ? testIds : ['none'])
    .eq('is_completed', true)
    .order('submitted_at', { ascending: false })

  // Group by student
  const studentMap = new Map<string, {
    user: { id: string; full_name: string | null; email: string; avatar_url: string | null; created_at: string }
    attempts: typeof attempts
  }>()

  for (const attempt of (attempts ?? [])) {
    const sid = attempt.student_id
    if (!studentMap.has(sid)) {
      studentMap.set(sid, { user: attempt.users, attempts: [] })
    }
    studentMap.get(sid)!.attempts!.push(attempt)
  }

  const students = Array.from(studentMap.values()).sort(
    (a, b) => (b.attempts?.length ?? 0) - (a.attempts?.length ?? 0)
  )

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">Students</h1>
        <p className="text-neutral-500 mt-1">
          {students.length} student{students.length !== 1 ? 's' : ''} who attempted your tests
        </p>
      </div>

      {!students.length ? (
        <div className="text-center py-16 text-neutral-400">
          <Users size={40} className="mx-auto mb-4 opacity-40" />
          <p>No students have taken your tests yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {students.map(({ user: student, attempts: studentAttempts }) => {
            const completed = studentAttempts ?? []
            const avgBand = completed.length
              ? completed.reduce((s, a) => s + (a.band_score ?? 0), 0) / completed.length
              : null
            const bestBand = completed.length
              ? Math.max(...completed.map((a) => a.band_score ?? 0))
              : null
            const lastAttempt = completed[0]

            return (
              <Card key={student?.id}>
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-full bg-neutral-100 flex items-center justify-center flex-shrink-0 text-base font-semibold text-neutral-600">
                    {student?.full_name?.[0]?.toUpperCase() || student?.email?.[0]?.toUpperCase() || '?'}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-neutral-900 text-sm">
                      {student?.full_name || 'Unnamed Student'}
                    </p>
                    <p className="text-xs text-neutral-500 truncate">{student?.email}</p>
                    {lastAttempt && (
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Last active: {formatDate(lastAttempt.submitted_at)}
                      </p>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-6 flex-shrink-0">
                    <div className="text-center">
                      <p className="text-lg font-bold text-neutral-900">{completed.length}</p>
                      <p className="text-xs text-neutral-400">tests taken</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-neutral-900">
                        {avgBand ? formatBandScore(avgBand) : '—'}
                      </p>
                      <p className="text-xs text-neutral-400">avg band</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-neutral-900">
                        {bestBand ? formatBandScore(bestBand) : '—'}
                      </p>
                      <p className="text-xs text-neutral-400">best band</p>
                    </div>
                  </div>
                </div>

                {/* Recent attempts */}
                {completed.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-neutral-100">
                    <p className="text-xs font-medium text-neutral-500 mb-2">Recent attempts</p>
                    <div className="flex flex-wrap gap-2">
                      {completed.slice(0, 5).map((attempt) => (
                        <div key={attempt.id} className="flex items-center gap-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1">
                          <Badge variant={attempt.tests?.type === 'listening' ? 'listening' : 'reading'} className="text-xs">
                            {attempt.tests?.type?.slice(0, 1).toUpperCase()}
                          </Badge>
                          <span className="text-neutral-600 truncate max-w-[120px]">{attempt.tests?.title}</span>
                          <span className="font-semibold text-neutral-900">{formatBandScore(attempt.band_score)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
