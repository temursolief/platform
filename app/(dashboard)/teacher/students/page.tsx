import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatDate, formatBandScore, formatClockTime } from '@/lib/utils/format'

const UsersIcon = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="8" r="3.5"/>
    <circle cx="17" cy="10" r="2.5"/>
    <path d="M3 20c0-3 3-5 6-5s6 2 6 5M15 20c0-2 2-3.5 4-3.5s3 1 3 3"/>
  </svg>
)
const ArrowRightIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6"/>
  </svg>
)

function bandToColor(band: number): string {
  if (band >= 8) return 'var(--accent)'
  if (band >= 7) return 'var(--sky)'
  if (band >= 6) return 'var(--primary)'
  return 'var(--rose)'
}

export default async function TeacherStudentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch profile, teacher's tests, and ALL students in parallel
  const [{ data: profile }, { data: tests }, { data: allStudents }] = await Promise.all([
    supabase.from('users').select('role').eq('id', user.id).single(),
    supabase.from('tests').select('id').eq('teacher_id', user.id),
    supabase
      .from('users')
      .select('id, full_name, email, avatar_url, created_at')
      .eq('role', 'student')
      .order('created_at', { ascending: false }),
  ])

  if (profile?.role === 'student') redirect('/student')

  const testIds = tests?.map((t) => t.id) ?? []

  type AttemptRow = {
    id: string; student_id: string; submitted_at: string; band_score: number | null
    tests: { title: string; type: string } | null
  }
  const { data: rawAttempts } = testIds.length
    ? await supabase
        .from('attempts')
        .select('id, student_id, submitted_at, band_score, tests(title, type)')
        .in('test_id', testIds)
        .eq('is_completed', true)
        .order('submitted_at', { ascending: false })
        .limit(500)
    : { data: [] }
  const attempts = rawAttempts as AttemptRow[] | null

  // Build attempt map keyed by student_id
  const attemptsByStudent = new Map<string, AttemptRow[]>()
  for (const attempt of (attempts ?? [])) {
    const list = attemptsByStudent.get(attempt.student_id) ?? []
    list.push(attempt)
    attemptsByStudent.set(attempt.student_id, list)
  }

  // All students with their attempts (includes students with 0 attempts)
  type StudentRow = { id: string; full_name: string | null; email: string; avatar_url: string | null; created_at: string }
  const students = (allStudents as StudentRow[] ?? []).map(s => ({
    user: s,
    attempts: attemptsByStudent.get(s.id) ?? [],
  })).sort((a, b) => b.attempts.length - a.attempts.length)

  const totalAttempts = attempts?.length ?? 0
  const avgClassBand = (() => {
    const withBand = (attempts ?? []).filter(a => a.band_score)
    return withBand.length ? withBand.reduce((s, a) => s + (a.band_score ?? 0), 0) / withBand.length : null
  })()

  return (
    <div className="py-8 px-10 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold leading-none" style={{ color: 'var(--ink)', fontFamily: 'Georgia, serif' }}>
            Students
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--ink-muted)' }}>
            {students.length} student{students.length !== 1 ? 's' : ''} registered on the platform
          </p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'TOTAL STUDENTS', value: students.length, color: 'var(--ink)', bg: 'var(--surface)' },
          { label: 'TOTAL ATTEMPTS', value: totalAttempts, color: 'var(--sky)', bg: 'var(--sky-soft)' },
          { label: 'CLASS AVG BAND', value: avgClassBand ? formatBandScore(avgClassBand) : '—', color: 'var(--primary-ink)', bg: 'var(--primary-soft)' },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl p-5" style={{ background: s.bg, border: '1.5px solid var(--line)' }}>
            <div className="text-[10px] font-bold tracking-widest mb-1" style={{ color: 'var(--ink-muted)' }}>{s.label}</div>
            <div className="text-4xl font-bold leading-none" style={{ color: s.color, fontFamily: 'Georgia, serif' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {!students.length ? (
        <div className="rounded-2xl p-16 text-center" style={{ background: 'var(--surface)', border: '1.5px solid var(--line)' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
               style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
            <UsersIcon />
          </div>
          <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--ink)', fontFamily: 'Georgia, serif' }}>No students yet</h3>
          <p className="text-sm mb-6" style={{ color: 'var(--ink-muted)' }}>Students will appear here once they register on the platform.</p>
          <Link href="/teacher/tests"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: 'var(--primary)' }}>
            Manage Tests
          </Link>
        </div>
      ) : (
        <div>
          {/* Roster table */}
          <div className="rounded-2xl overflow-hidden" style={{ border: '1.5px solid var(--line)', background: 'var(--surface)' }}>
            {/* Header */}
            <div className="grid gap-4 px-5 py-3 text-[10px] font-bold tracking-widest"
                 style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', color: 'var(--ink-muted)', borderBottom: '1.5px solid var(--line)' }}>
              <div>STUDENT</div>
              <div>TESTS TAKEN</div>
              <div>AVG BAND</div>
              <div>BEST BAND</div>
              <div>LAST ACTIVE</div>
            </div>

            {students.map(({ user: student, attempts: studentAttempts }, i) => {
              const completed = studentAttempts ?? []
              const avgBand = completed.length
                ? completed.reduce((s, a) => s + (a.band_score ?? 0), 0) / completed.length
                : null
              const bestBand = completed.length
                ? Math.max(...completed.map((a) => a.band_score ?? 0))
                : null
              const lastAttempt = completed[0]
              const initials = student?.full_name
                ? student.full_name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
                : student?.email?.[0]?.toUpperCase() || '?'

              return (
                <div key={student?.id}
                     className="grid gap-4 px-5 py-4 items-center transition-colors hover:bg-[var(--surface-2)]"
                     style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', borderTop: i === 0 ? 'none' : '1px solid var(--line)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
                         style={{ background: 'var(--accent)' }}>
                      {initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                        {student?.full_name || 'Unnamed Student'}
                      </p>
                      <p className="text-[11px] truncate max-w-[160px]" style={{ color: 'var(--ink-muted)' }}>
                        {student?.email}
                      </p>
                    </div>
                  </div>
                  <div className="text-xl font-bold" style={{ color: completed.length ? 'var(--ink)' : 'var(--ink-muted)', fontFamily: 'Georgia, serif' }}>
                    {completed.length || '—'}
                  </div>
                  <div>
                    {avgBand ? (
                      <span className="text-xl font-bold" style={{ color: bandToColor(avgBand), fontFamily: 'Georgia, serif' }}>
                        {formatBandScore(avgBand)}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--ink-muted)' }}>—</span>
                    )}
                  </div>
                  <div>
                    {bestBand ? (
                      <span className="text-xl font-bold" style={{ color: bandToColor(bestBand), fontFamily: 'Georgia, serif' }}>
                        {formatBandScore(bestBand)}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--ink-muted)' }}>—</span>
                    )}
                  </div>
                  <div>
                    {lastAttempt ? (
                      <>
                        <div className="text-sm" style={{ color: 'var(--ink-soft)' }}>{formatDate(lastAttempt.submitted_at)}</div>
                        <div className="text-xs" style={{ color: 'var(--ink-muted)' }}>{formatClockTime(lastAttempt.submitted_at)}</div>
                      </>
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--ink-muted)' }}>No attempts yet</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Student detail cards */}
          {students.some(s => s.attempts.length > 0) && (
            <div className="mt-8 space-y-4">
              <h2 className="text-2xl font-bold" style={{ color: 'var(--ink)', fontFamily: 'Georgia, serif' }}>Student Details</h2>
              {students.filter(s => s.attempts.length > 0).slice(0, 8).map(({ user: student, attempts: studentAttempts }) => {
                const completed = studentAttempts ?? []
                const avgBand = completed.length
                  ? completed.reduce((s, a) => s + (a.band_score ?? 0), 0) / completed.length
                  : null
                const initials = student?.full_name
                  ? student.full_name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
                  : student?.email?.[0]?.toUpperCase() || '?'

                return (
                  <div key={student?.id} className="rounded-2xl p-5"
                       style={{ background: 'var(--surface)', border: '1.5px solid var(--line)' }}>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-base font-bold text-white shrink-0"
                           style={{ background: 'var(--accent)' }}>
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm" style={{ color: 'var(--ink)' }}>
                          {student?.full_name || 'Unnamed Student'}
                        </p>
                        <p className="text-xs truncate" style={{ color: 'var(--ink-muted)' }}>{student?.email}</p>
                      </div>
                      <div className="flex items-center gap-6 shrink-0">
                        {[
                          { label: 'tests', value: completed.length },
                          { label: 'avg band', value: avgBand ? formatBandScore(avgBand) : '—' },
                        ].map((stat) => (
                          <div key={stat.label} className="text-center">
                            <p className="text-xl font-bold" style={{ color: 'var(--ink)', fontFamily: 'Georgia, serif' }}>{stat.value}</p>
                            <p className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>{stat.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {completed.length > 0 && (
                      <div className="pt-4 flex flex-wrap gap-2" style={{ borderTop: '1px solid var(--line)' }}>
                        {completed.slice(0, 5).map((attempt) => (
                          <div key={attempt.id}
                               className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full"
                               style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
                            <span className="inline-flex text-xs font-semibold px-1.5 py-0.5 rounded capitalize"
                                  style={{
                                    background: attempt.tests?.type === 'listening' ? 'var(--plum-soft)' : 'var(--sky-soft)',
                                    color: attempt.tests?.type === 'listening' ? 'var(--plum)' : 'var(--sky)',
                                    fontSize: '10px',
                                  }}>
                              {attempt.tests?.type?.slice(0, 1).toUpperCase()}
                            </span>
                            <span className="truncate max-w-[120px]" style={{ color: 'var(--ink-soft)' }}>
                              {attempt.tests?.title}
                            </span>
                            <span className="font-bold" style={{ color: 'var(--ink)' }}>
                              {formatBandScore(attempt.band_score)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
