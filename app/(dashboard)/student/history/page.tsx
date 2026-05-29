import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ProgressChart } from '@/components/dashboard/ProgressChart'
import { formatBandScore, formatDate, formatClockTime, formatScore } from '@/lib/utils/format'
import { formatDuration } from '@/lib/utils/time'
import { getBandDescriptor } from '@/lib/scoring/band-tables'

const BookIcon = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2V5Z"/><path d="M4 19a2 2 0 0 1 2-2h12"/>
  </svg>
)
const ClockIcon = () => (
  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>
  </svg>
)
const ChartIcon = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18"/><path d="M7 14l3-3 3 3 5-6"/>
  </svg>
)
const ArrowRightIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6"/>
  </svg>
)

function bandToColor(band: number | null): string {
  if (!band) return 'var(--ink-muted)'
  if (band >= 8) return 'var(--accent)'
  if (band >= 7) return 'var(--sky)'
  if (band >= 6) return 'var(--primary)'
  return 'var(--rose)'
}

export default async function StudentHistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: rawAttempts } = await supabase
    .from('attempts')
    .select('id, test_id, submitted_at, raw_score, total_questions, band_score, time_taken_seconds, tests(id, title, type)')
    .eq('student_id', user.id)
    .eq('is_completed', true)
    .order('submitted_at', { ascending: false })
    .limit(100)

  type AttemptRow = {
    id: string; test_id: string; submitted_at: string
    raw_score: number | null; total_questions: number | null
    band_score: number | null; time_taken_seconds: number | null
    tests: { id: string; title: string; type: string } | null
  }
  const attempts = rawAttempts as AttemptRow[] | null

  const chartData = (attempts ?? [])
    .filter((a) => a.submitted_at && a.band_score)
    .map((a) => ({
      date: formatDate(a.submitted_at),
      bandScore: a.band_score!,
      type: (a.tests?.type ?? 'reading') as 'reading' | 'listening',
    }))
    .reverse()

  const avgBand = attempts?.length
    ? attempts.reduce((s, a) => s + (a.band_score ?? 0), 0) / attempts.length
    : null
  const bestBand = attempts?.length
    ? Math.max(...attempts.map((a) => a.band_score ?? 0))
    : null
  const totalTime = attempts?.reduce((s, a) => s + (a.time_taken_seconds ?? 0), 0) ?? 0

  return (
    <div className="py-8 px-10 max-w-[1200px]">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold leading-none" style={{ color: 'var(--ink)', fontFamily: 'Georgia, serif' }}>
          History
        </h1>
        <p className="text-sm mt-2" style={{ color: 'var(--ink-muted)' }}>
          {attempts?.length ?? 0} completed tests
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'TESTS DONE', value: attempts?.length ?? 0, color: 'var(--ink)' },
          { label: 'AVG BAND', value: avgBand ? formatBandScore(avgBand) : '—', color: 'var(--primary)' },
          { label: 'BEST BAND', value: bestBand ? formatBandScore(bestBand) : '—', color: 'var(--accent)' },
          { label: 'TOTAL TIME', value: totalTime ? formatDuration(totalTime) : '0 min', color: 'var(--sky)' },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1.5px solid var(--line)' }}>
            <div className="text-[10px] font-bold tracking-widest mb-1" style={{ color: 'var(--ink-muted)' }}>{s.label}</div>
            <div className="text-4xl font-bold leading-none" style={{ color: s.color, fontFamily: 'Georgia, serif' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Progress chart */}
      {chartData.length > 1 && (
        <div className="rounded-2xl p-6 mb-8" style={{ background: 'var(--surface)', border: '1.5px solid var(--line)' }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
              <ChartIcon />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--ink)', fontFamily: 'Georgia, serif' }}>Band Score Over Time</h2>
              <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>Your progression</p>
            </div>
          </div>
          <ProgressChart data={chartData} height={160} />
        </div>
      )}

      {/* Attempts list */}
      {!attempts?.length ? (
        <div className="rounded-2xl p-16 text-center" style={{ background: 'var(--surface)', border: '1.5px solid var(--line)' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
               style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
            <BookIcon />
          </div>
          <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--ink)', fontFamily: 'Georgia, serif' }}>No history yet</h3>
          <p className="text-sm mb-6" style={{ color: 'var(--ink-muted)' }}>Complete your first test to see your results here.</p>
          <Link href="/student/tests"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: 'var(--primary)' }}>
            Browse Tests
          </Link>
        </div>
      ) : (
        <div>
          <div className="flex items-end justify-between mb-4">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--ink)', fontFamily: 'Georgia, serif' }}>All Attempts</h2>
          </div>
          <div className="rounded-2xl overflow-hidden" style={{ border: '1.5px solid var(--line)', background: 'var(--surface)' }}>
            <div className="grid gap-4 px-5 py-3 text-[10px] font-bold tracking-widest"
                 style={{ gridTemplateColumns: '1fr 100px 120px 80px 80px 60px', color: 'var(--ink-muted)', borderBottom: '1.5px solid var(--line)' }}>
              <div>TEST</div><div>TYPE</div><div>DATE</div><div>SCORE</div><div>BAND</div><div></div>
            </div>

            {attempts.map((attempt, i) => (
              <div
                key={attempt.id}
                className="grid gap-4 px-5 py-4 items-center transition-colors hover:bg-[var(--surface-2)]"
                style={{ gridTemplateColumns: '1fr 100px 120px 80px 80px 60px', borderTop: i === 0 ? 'none' : '1px solid var(--line)' }}
              >
                <div className="text-sm font-semibold truncate" style={{ color: 'var(--ink)' }}>
                  {attempt.tests?.title ?? 'Unknown Test'}
                </div>
                <div>
                  <span
                    className="inline-flex text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize"
                    style={{
                      background: attempt.tests?.type === 'listening' ? 'var(--plum-soft)' : 'var(--sky-soft)',
                      color: attempt.tests?.type === 'listening' ? 'var(--plum)' : 'var(--sky)',
                    }}
                  >
                    {attempt.tests?.type}
                  </span>
                </div>
                <div>
                  <div className="text-sm" style={{ color: 'var(--ink-soft)' }}>{formatDate(attempt.submitted_at)}</div>
                  <div className="text-xs" style={{ color: 'var(--ink-muted)' }}>{formatClockTime(attempt.submitted_at)}</div>
                  {attempt.time_taken_seconds && (
                    <div className="flex items-center gap-1 text-xs mt-0.5" style={{ color: 'var(--ink-muted)' }}>
                      <ClockIcon /> {formatDuration(attempt.time_taken_seconds)}
                    </div>
                  )}
                </div>
                <div className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                  {formatScore(attempt.raw_score, attempt.total_questions)}
                </div>
                <div>
                  <span className="text-xl font-bold" style={{ color: bandToColor(attempt.band_score), fontFamily: 'Georgia, serif' }}>
                    {formatBandScore(attempt.band_score)}
                  </span>
                  <div className="text-[10px] mt-0.5" style={{ color: 'var(--ink-muted)' }}>
                    {getBandDescriptor(attempt.band_score ?? 0)}
                  </div>
                </div>
                <div>
                  <Link
                    href={`/student/tests/${attempt.test_id}/result?attemptId=${attempt.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold transition-opacity hover:opacity-70"
                    style={{ color: 'var(--primary)' }}
                  >
                    Review <ArrowRightIcon />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
