import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate, formatBandScore } from '@/lib/utils/format'

const BookIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2V5Z"/><path d="M4 19a2 2 0 0 1 2-2h12"/>
  </svg>
)
const UsersIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="8" r="3.5"/>
    <circle cx="17" cy="10" r="2.5"/>
    <path d="M3 20c0-3 3-5 6-5s6 2 6 5M15 20c0-2 2-3.5 4-3.5s3 1 3 3"/>
  </svg>
)
const ChartIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18"/><path d="M7 14l3-3 3 3 5-6"/>
  </svg>
)
const PlusIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14"/>
  </svg>
)
const ArrowRightIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6"/>
  </svg>
)
const SparklesIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/>
  </svg>
)

export default async function TeacherDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

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

  const testIds = tests?.map((t) => t.id) ?? []
  type AttemptRow = {
    id: string; student_id: string; submitted_at: string; band_score: number | null
    users: { full_name: string | null; email: string } | null
  }
  const { data: rawAttempts } = testIds.length
    ? await supabase
        .from('attempts')
        .select('id, student_id, submitted_at, band_score, users(full_name, email)')
        .in('test_id', testIds)
        .eq('is_completed', true)
        .order('submitted_at', { ascending: false })
        .limit(20)
    : { data: [] }
  const attempts = rawAttempts as AttemptRow[] | null

  const publishedCount = tests?.filter((t) => t.is_published).length ?? 0
  const draftCount = (tests?.length ?? 0) - publishedCount
  const uniqueStudents = new Set(attempts?.map((a) => a.student_id)).size
  const avgBand = attempts?.length
    ? attempts.reduce((s, a) => s + (a.band_score ?? 0), 0) / attempts.length
    : null

  const firstName = profile?.full_name?.split(' ')[0] || 'Teacher'

  return (
    <div className="py-8 px-10 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold leading-none" style={{ color: 'var(--ink)', fontFamily: 'Georgia, serif' }}>
            Classroom
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--ink-muted)' }}>
            Welcome back, {firstName} · {uniqueStudents} active students
          </p>
        </div>
        <Link
          href="/teacher/tests/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'var(--primary)' }}
        >
          <PlusIcon /> New Test
        </Link>
      </div>

      {/* Class summary stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'PUBLISHED TESTS', value: publishedCount, color: 'var(--ink)', bg: 'var(--surface)' },
          { label: 'DRAFT TESTS', value: draftCount, color: 'var(--gold-ink)', bg: 'var(--gold-soft)' },
          { label: 'ACTIVE STUDENTS', value: uniqueStudents, color: 'var(--accent-ink)', bg: 'var(--accent-soft)' },
          { label: 'AVG BAND SCORE', value: avgBand ? formatBandScore(avgBand) : '—', color: 'var(--primary-ink)', bg: 'var(--primary-soft)' },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl p-5" style={{ background: s.bg, border: '1.5px solid var(--line)' }}>
            <div className="text-[10px] font-bold tracking-widest mb-1" style={{ color: 'var(--ink-muted)' }}>{s.label}</div>
            <div className="text-4xl font-bold leading-none" style={{ color: s.color, fontFamily: 'Georgia, serif' }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Tests overview */}
        <div className="col-span-8">
          <div className="flex items-end justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--ink)', fontFamily: 'Georgia, serif' }}>Your Tests</h2>
              <p className="text-sm mt-0.5" style={{ color: 'var(--ink-muted)' }}>{tests?.length ?? 0} total</p>
            </div>
            <Link href="/teacher/tests"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: 'var(--primary)' }}>
              View all <ArrowRightIcon />
            </Link>
          </div>

          <div className="rounded-2xl overflow-hidden" style={{ border: '1.5px solid var(--line)', background: 'var(--surface)' }}>
            {!tests?.length ? (
              <div className="py-12 text-center">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                     style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
                  <BookIcon />
                </div>
                <p className="text-sm font-semibold mb-1" style={{ color: 'var(--ink)' }}>No tests yet</p>
                <Link href="/teacher/tests/new" className="text-sm" style={{ color: 'var(--primary)' }}>
                  Create your first test →
                </Link>
              </div>
            ) : (
              <>
                <div className="grid gap-4 px-5 py-3 text-[10px] font-bold tracking-widest"
                     style={{ gridTemplateColumns: '1fr 100px 80px 80px', color: 'var(--ink-muted)', borderBottom: '1.5px solid var(--line)' }}>
                  <div>TITLE</div><div>TYPE</div><div>QUESTIONS</div><div>STATUS</div>
                </div>
                {tests.slice(0, 6).map((test, i) => (
                  <div key={test.id}
                       className="grid gap-4 px-5 py-4 items-center transition-colors hover:bg-[var(--surface-2)]"
                       style={{ gridTemplateColumns: '1fr 100px 80px 80px', borderTop: i === 0 ? 'none' : '1px solid var(--line)' }}>
                    <div className="text-sm font-semibold truncate" style={{ color: 'var(--ink)' }}>{test.title}</div>
                    <div>
                      <span className="inline-flex text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize"
                            style={{
                              background: test.type === 'listening' ? 'var(--plum-soft)' : 'var(--sky-soft)',
                              color: test.type === 'listening' ? 'var(--plum)' : 'var(--sky)',
                            }}>
                        {test.type}
                      </span>
                    </div>
                    <div className="text-sm font-semibold" style={{ color: 'var(--ink-soft)' }}>{test.total_questions}</div>
                    <div>
                      <span className="inline-flex text-xs font-semibold px-2.5 py-0.5 rounded-full"
                            style={{
                              background: test.is_published ? 'var(--accent-soft)' : 'var(--surface-2)',
                              color: test.is_published ? 'var(--accent-ink)' : 'var(--ink-muted)',
                            }}>
                        {test.is_published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Recent activity + insights */}
        <div className="col-span-4 space-y-4">
          {/* Insights card */}
          <div className="rounded-2xl p-6" style={{ background: 'var(--ink)', color: 'white' }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="opacity-70"><SparklesIcon /></span>
              <div className="text-[10px] font-bold tracking-widest opacity-60">TEACHING INSIGHTS</div>
            </div>
            <h3 className="text-xl font-bold leading-tight mb-4" style={{ fontFamily: 'Georgia, serif' }}>
              Quick summary
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm opacity-80">
                <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: 'var(--primary)' }} />
                <span>
                  <span className="font-bold opacity-100">{uniqueStudents} student{uniqueStudents !== 1 ? 's' : ''}</span>
                  {' '}have attempted your tests
                </span>
              </li>
              <li className="flex items-start gap-2 text-sm opacity-80">
                <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: 'var(--gold)' }} />
                <span>
                  <span className="font-bold opacity-100">{draftCount} test{draftCount !== 1 ? 's' : ''}</span>
                  {' '}waiting to be published
                </span>
              </li>
              {avgBand && (
                <li className="flex items-start gap-2 text-sm opacity-80">
                  <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: 'var(--accent)' }} />
                  <span>Class avg: <span className="font-bold opacity-100">Band {formatBandScore(avgBand)}</span></span>
                </li>
              )}
            </ul>
            <Link
              href="/teacher/students"
              className="mt-5 flex items-center justify-center w-full py-2 rounded-xl text-xs font-semibold hover:opacity-80 transition-opacity"
              style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}
            >
              View all students →
            </Link>
          </div>

          {/* Recent attempts */}
          <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1.5px solid var(--line)' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
                <ChartIcon />
              </div>
              <h3 className="text-base font-bold" style={{ color: 'var(--ink)', fontFamily: 'Georgia, serif' }}>Recent Attempts</h3>
            </div>

            {!attempts?.length ? (
              <p className="text-sm text-center py-4" style={{ color: 'var(--ink-muted)' }}>No attempts yet</p>
            ) : (
              <div className="space-y-3">
                {attempts.slice(0, 5).map((attempt) => (
                  <div key={attempt.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold truncate max-w-[140px]" style={{ color: 'var(--ink)' }}>
                        {attempt.users?.full_name || attempt.users?.email || 'Student'}
                      </p>
                      <p className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>{formatDate(attempt.submitted_at)}</p>
                    </div>
                    <span className="text-xl font-bold" style={{ color: 'var(--primary)', fontFamily: 'Georgia, serif' }}>
                      {formatBandScore(attempt.band_score)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick nav */}
      <div className="grid grid-cols-3 gap-4 mt-8">
        {[
          { href: '/teacher/tests', label: 'Manage Tests', sub: 'Create & edit your tests', icon: <BookIcon />, color: 'var(--sky)', soft: 'var(--sky-soft)' },
          { href: '/teacher/students', label: 'View Students', sub: 'Track student performance', icon: <UsersIcon />, color: 'var(--accent)', soft: 'var(--accent-soft)' },
          { href: '/teacher/tests/new', label: 'New Test', sub: 'Upload or create a test', icon: <PlusIcon />, color: 'var(--primary)', soft: 'var(--primary-soft)' },
        ].map((item) => (
          <Link key={item.href} href={item.href}
                className="rounded-2xl p-5 flex items-center gap-4 transition-all hover:-translate-y-0.5"
                style={{ background: 'var(--surface)', border: '1.5px solid var(--line)' }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                 style={{ background: item.soft, color: item.color }}>
              {item.icon}
            </div>
            <div>
              <div className="text-sm font-bold" style={{ color: 'var(--ink)' }}>{item.label}</div>
              <div className="text-xs" style={{ color: 'var(--ink-muted)' }}>{item.sub}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
