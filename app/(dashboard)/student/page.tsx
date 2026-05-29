import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatBandScore, formatDate } from '@/lib/utils/format'
import { formatDuration } from '@/lib/utils/time'

// ─── Tiny SVG icons ───────────────────────────────────────────────────────────
const BookIcon = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2V5Z"/><path d="M4 19a2 2 0 0 1 2-2h12"/>
  </svg>
)
const ClockIcon = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>
  </svg>
)
const TargetIcon = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/>
    <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
  </svg>
)
const ChartIcon = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18"/><path d="M7 14l3-3 3 3 5-6"/>
  </svg>
)
const ArrowRightIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6"/>
  </svg>
)
const CheckIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12l5 5 11-11"/>
  </svg>
)

// ─── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color, icon }: {
  label: string; value: string | number; sub?: string; color?: string; icon?: React.ReactNode
}) {
  return (
    <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1.5px solid var(--line)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] font-bold tracking-widest" style={{ color: 'var(--ink-muted)' }}>{label.toUpperCase()}</div>
        {icon && (
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--surface-2)', color: 'var(--ink-soft)' }}>
            {icon}
          </div>
        )}
      </div>
      <div className="font-bold text-4xl leading-none" style={{ color: color || 'var(--ink)', fontFamily: 'Georgia, serif' }}>
        {value}
      </div>
      {sub && <div className="mt-2 text-xs" style={{ color: 'var(--ink-muted)' }}>{sub}</div>}
    </div>
  )
}

// ─── ProgressBar ──────────────────────────────────────────────────────────────
function ProgressBar({ value, max = 100, color = 'var(--primary)' }: { value: number; max?: number; color?: string }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div className="rounded-full overflow-hidden h-1.5" style={{ background: 'var(--surface-2)' }}>
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function StudentDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'teacher') redirect('/teacher')

  const { data: attempts } = await supabase
    .from('attempts')
    .select(`*, tests(title, type)`)
    .eq('student_id', user.id)
    .eq('is_completed', true)
    .order('submitted_at', { ascending: false })
    .limit(10)

  const totalAttempts = attempts?.length ?? 0
  const avgBand = attempts?.length
    ? attempts.reduce((s, a) => s + (a.band_score ?? 0), 0) / attempts.length
    : null
  const bestBand = attempts?.length ? Math.max(...attempts.map((a) => a.band_score ?? 0)) : null
  const totalStudyTime = attempts?.reduce((s, a) => s + (a.time_taken_seconds ?? 0), 0) ?? 0

  const firstName = profile?.full_name?.split(' ')[0] || 'Student'

  const now = new Date()
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening'
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' })
  const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })

  return (
    <div className="py-8 px-10 max-w-[1200px]">
      {/* TopBar */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold leading-none" style={{ color: 'var(--ink)', fontFamily: 'Georgia, serif' }}>
            {greeting}, {firstName}
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--ink-muted)' }}>
            {dayName}, {dateStr}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/student/tests"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: 'var(--primary)' }}
          >
            <BookIcon />
            Take a Test
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Tests Taken" value={totalAttempts} icon={<BookIcon />} />
        <StatCard
          label="Avg Band Score"
          value={avgBand ? formatBandScore(avgBand) : '—'}
          color="var(--primary)"
          icon={<ChartIcon />}
        />
        <StatCard
          label="Best Band Score"
          value={bestBand ? formatBandScore(bestBand) : '—'}
          color="var(--accent)"
          icon={<TargetIcon />}
        />
        <StatCard
          label="Total Study Time"
          value={totalStudyTime ? formatDuration(totalStudyTime) : '0 min'}
          icon={<ClockIcon />}
        />
      </div>

      {/* Hero band card + quick actions */}
      <div className="grid grid-cols-12 gap-6 mb-8">
        {/* Band progress hero */}
        <div
          className="col-span-8 rounded-2xl p-8 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #FFF8EE 0%, var(--surface) 60%)',
            border: '1.5px solid var(--line)',
          }}
        >
          {/* decorative circles */}
          <svg className="absolute right-0 top-0 pointer-events-none opacity-[0.05]" width="320" height="320" viewBox="0 0 400 400">
            {[...Array(6)].map((_, i) => (
              <circle key={i} cx="320" cy="80" r={50 + i * 35} fill="none" stroke="var(--primary)" strokeWidth="1.5" />
            ))}
          </svg>

          <div className="relative">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-4"
                 style={{ background: 'var(--primary-soft)', color: 'var(--primary-ink)' }}>
              <TargetIcon />
              BAND SCORE TRACKER
            </div>
            <h2 className="text-3xl font-bold leading-tight mb-2" style={{ color: 'var(--ink)', fontFamily: 'Georgia, serif' }}>
              {avgBand
                ? <>Your current average is <em className="not-italic" style={{ color: 'var(--primary)' }}>{formatBandScore(avgBand)}</em></>
                : 'Take your first test to track progress'}
            </h2>
            {bestBand && (
              <p className="text-sm mb-6" style={{ color: 'var(--ink-soft)' }}>
                Personal best: <span className="font-semibold" style={{ color: 'var(--ink)' }}>{formatBandScore(bestBand)}</span>
                {' '}· {totalAttempts} test{totalAttempts !== 1 ? 's' : ''} completed
              </p>
            )}

            {/* Band progress bar */}
            {avgBand && (
              <div className="mb-6">
                <div className="flex justify-between text-xs mb-2" style={{ color: 'var(--ink-muted)' }}>
                  <span>Band {Math.floor(avgBand)}</span>
                  <span style={{ color: 'var(--primary-ink)', fontWeight: 600 }}>Target: Band 9</span>
                </div>
                <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--line)' }}>
                  <div className="h-full rounded-full"
                       style={{ width: `${(avgBand / 9) * 100}%`, background: 'linear-gradient(90deg, #F0A088, var(--primary))' }} />
                </div>
                <div className="flex justify-between text-[10px] mt-1.5 font-semibold" style={{ color: 'var(--ink-muted)' }}>
                  {[1,2,3,4,5,6,7,8,9].map(b => <span key={b}>{b}</span>)}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Link
                href="/student/tests"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: 'var(--primary)' }}
              >
                Continue practice <ArrowRightIcon />
              </Link>
              <Link
                href="/student/history"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
                style={{ border: '1.5px solid var(--line-2)', color: 'var(--ink-soft)' }}
              >
                View history
              </Link>
            </div>
          </div>
        </div>

        {/* Today's plan */}
        <div
          className="col-span-4 rounded-2xl p-6"
          style={{ background: 'var(--ink)', color: 'white' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <ClockIcon />
            <div className="text-[10px] font-bold tracking-widest opacity-60">TODAY&apos;S PLAN</div>
          </div>
          <h3 className="text-xl font-bold leading-tight mb-5" style={{ fontFamily: 'Georgia, serif' }}>
            What to focus on
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Complete 1 reading test', done: totalAttempts > 0 },
              { label: 'Review your results', done: totalAttempts > 1 },
              { label: 'Track your band score', done: !!avgBand },
            ].map((t, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: t.done ? 'var(--primary)' : 'transparent',
                    border: t.done ? 'none' : '1.5px solid rgba(255,255,255,0.3)',
                  }}
                >
                  {t.done && <CheckIcon />}
                </div>
                <span className={`text-sm ${t.done ? 'line-through opacity-50' : ''}`}>{t.label}</span>
              </div>
            ))}
          </div>
          <Link
            href="/student/tests"
            className="mt-6 flex items-center justify-center w-full py-2 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80"
            style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}
          >
            Start a test →
          </Link>
        </div>
      </div>

      {/* Recent attempts */}
      {attempts && attempts.length > 0 && (
        <div>
          <div className="flex items-end justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--ink)', fontFamily: 'Georgia, serif' }}>
                Recent Tests
              </h2>
              <p className="text-sm mt-0.5" style={{ color: 'var(--ink-muted)' }}>Your latest attempts</p>
            </div>
            <Link
              href="/student/history"
              className="inline-flex items-center gap-1.5 text-sm font-semibold"
              style={{ color: 'var(--primary)' }}
            >
              View all <ArrowRightIcon />
            </Link>
          </div>

          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: '1.5px solid var(--line)', background: 'var(--surface)' }}
          >
            {/* Header */}
            <div
              className="grid gap-4 px-5 py-3 text-[10px] font-bold tracking-widest"
              style={{
                gridTemplateColumns: '1fr 100px 100px 80px 80px',
                color: 'var(--ink-muted)',
                borderBottom: '1.5px solid var(--line)',
              }}
            >
              <div>TEST</div>
              <div>TYPE</div>
              <div>DATE</div>
              <div>SCORE</div>
              <div>BAND</div>
            </div>

            {attempts.slice(0, 6).map((attempt, i) => (
              <div
                key={attempt.id}
                className="grid gap-4 px-5 py-4 items-center transition-colors hover:bg-[var(--surface-2)]"
                style={{
                  gridTemplateColumns: '1fr 100px 100px 80px 80px',
                  borderTop: i === 0 ? 'none' : '1px solid var(--line)',
                }}
              >
                <div className="text-sm font-semibold truncate" style={{ color: 'var(--ink)' }}>
                  {attempt.tests?.title ?? 'Unknown Test'}
                </div>
                <div>
                  <span
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize"
                    style={{
                      background: attempt.tests?.type === 'listening' ? 'var(--plum-soft)' : 'var(--sky-soft)',
                      color: attempt.tests?.type === 'listening' ? 'var(--plum)' : 'var(--sky)',
                    }}
                  >
                    {attempt.tests?.type}
                  </span>
                </div>
                <div className="text-sm" style={{ color: 'var(--ink-soft)' }}>
                  {formatDate(attempt.submitted_at)}
                </div>
                <div className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                  {attempt.raw_score}/{attempt.total_questions}
                </div>
                <div>
                  <Link
                    href={`/student/tests/${attempt.test_id}/result?attemptId=${attempt.id}`}
                    className="inline-block text-xl font-bold transition-opacity hover:opacity-70"
                    style={{ color: 'var(--primary)', fontFamily: 'Georgia, serif' }}
                  >
                    {formatBandScore(attempt.band_score)}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {(!attempts || attempts.length === 0) && (
        <div
          className="rounded-2xl p-16 text-center"
          style={{ background: 'var(--surface)', border: '1.5px solid var(--line)' }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
          >
            <BookIcon />
          </div>
          <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--ink)', fontFamily: 'Georgia, serif' }}>
            No tests yet
          </h3>
          <p className="text-sm mb-6" style={{ color: 'var(--ink-muted)' }}>
            Take your first test to start tracking your IELTS progress
          </p>
          <Link
            href="/student/tests"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'var(--primary)' }}
          >
            Browse Tests <ArrowRightIcon />
          </Link>
        </div>
      )}
    </div>
  )
}
