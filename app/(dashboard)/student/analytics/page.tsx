import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatBandScore, formatDate, formatClockTime } from '@/lib/utils/format'
import { formatDuration } from '@/lib/utils/time'

const ArrowRightIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6"/>
  </svg>
)
const BookIcon = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2V5Z"/><path d="M4 19a2 2 0 0 1 2-2h12"/>
  </svg>
)
const ChartUpIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 7l-8.5 8.5-5-5L2 17M22 7h-6M22 7v6"/>
  </svg>
)
const ArrowUpIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 19V5M5 12l7-7 7 7"/>
  </svg>
)
const CheckIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12l5 5 11-11"/>
  </svg>
)
const TargetIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>
  </svg>
)

type AttemptRow = {
  id: string; test_id: string; submitted_at: string
  raw_score: number | null; total_questions: number | null
  band_score: number | null; time_taken_seconds: number | null
  tests: { id: string; title: string; type: string } | null
}

// ─── Band Progression Chart ──────────────────────────────────────────────────
function BandChart({ attempts }: { attempts: AttemptRow[] }) {
  const w = 680, h = 240, pad = { l: 36, r: 20, t: 20, b: 36 }

  const sorted = [...attempts].sort((a, b) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime())
  if (sorted.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-xl text-sm h-32"
           style={{ background: 'var(--surface-2)', color: 'var(--ink-muted)' }}>
        Take some tests to see your band progression
      </div>
    )
  }

  // Dynamic Y range: floor of min score - 1 (clamped to 0) and ceil of max + 0.5 (clamped to 9)
  const bandScores = sorted.map(a => a.band_score ?? 0).filter(b => b > 0)
  const dataMin = bandScores.length ? Math.min(...bandScores) : 5
  const dataMax = bandScores.length ? Math.max(...bandScores) : 9
  const minY = Math.max(0, Math.floor(dataMin) - 1)
  const maxY = Math.min(9, Math.ceil(dataMax) + 0.5)
  const yRange = maxY - minY || 1

  const clampY = (v: number) => Math.max(minY, Math.min(maxY, v))
  const toY = (v: number) => pad.t + (1 - (clampY(v) - minY) / yRange) * (h - pad.t - pad.b)

  const reading = sorted.filter(a => a.tests?.type !== 'listening')
  const listening = sorted.filter(a => a.tests?.type === 'listening')

  const dates = sorted.map(a => new Date(a.submitted_at).getTime())
  const minDate = Math.min(...dates)
  const maxDate = Math.max(...dates)
  const dateRange = maxDate - minDate || 1
  const toX = (ts: number) => pad.l + ((ts - minDate) / dateRange) * (w - pad.l - pad.r)

  const makePath = (items: AttemptRow[]) =>
    items.map((a, i) => {
      const x = toX(new Date(a.submitted_at).getTime())
      const y = toY(a.band_score ?? 5)
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    }).join(' ')

  // Grid lines: integer bands within the visible range
  const gridLines = Array.from({ length: Math.ceil(maxY) - Math.floor(minY) + 1 }, (_, i) => Math.floor(minY) + i)
    .filter(v => v >= minY && v <= maxY)

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
      {/* Grid */}
      {gridLines.map(v => {
        const y = toY(v)
        return (
          <g key={v}>
            <line x1={pad.l} y1={y} x2={w - pad.r} y2={y}
                  stroke="var(--line)" strokeWidth="1" strokeDasharray="3 4" />
            <text x={pad.l - 6} y={y + 4} textAnchor="end" fontSize="10"
                  fill="var(--ink-muted)" fontWeight="600">{v}</text>
          </g>
        )
      })}

      {/* Reading line */}
      {reading.length > 1 && (
        <path d={makePath(reading)} fill="none" stroke="var(--sky)" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round" />
      )}
      {reading.map(a => (
        <circle key={`r-${a.id}`}
                cx={toX(new Date(a.submitted_at).getTime())}
                cy={toY(a.band_score ?? 5)}
                r={reading.length === 1 ? 5 : 3.5}
                fill="var(--sky)" stroke="var(--surface)" strokeWidth="2" />
      ))}

      {/* Listening line */}
      {listening.length > 1 && (
        <path d={makePath(listening)} fill="none" stroke="var(--plum)" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round" />
      )}
      {listening.map(a => (
        <circle key={`l-${a.id}`}
                cx={toX(new Date(a.submitted_at).getTime())}
                cy={toY(a.band_score ?? 5)}
                r={listening.length === 1 ? 5 : 3.5}
                fill="var(--plum)" stroke="var(--surface)" strokeWidth="2" />
      ))}

      {/* X-axis date labels (show up to 6) */}
      {sorted
        .filter((_, i) => i === 0 || i === sorted.length - 1 || (sorted.length <= 6 && i > 0 && i < sorted.length - 1))
        .slice(0, 6)
        .map((a) => {
          const x = toX(new Date(a.submitted_at).getTime())
          const label = new Date(a.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          return (
            <text key={`lbl-${a.id}`} x={x} y={h - 8} textAnchor="middle"
                  fontSize="10" fill="var(--ink-muted)" fontWeight="600">
              {label}
            </text>
          )
        })}
    </svg>
  )
}

// ─── Activity Heatmap ────────────────────────────────────────────────────────
function ActivityHeatmap({ attempts }: { attempts: AttemptRow[] }) {
  const cell = 13, gap = 3
  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

  const now = new Date()
  const dayOfWeek = now.getDay()
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const thisMonday = new Date(now)
  thisMonday.setDate(now.getDate() - daysFromMonday)
  thisMonday.setHours(0, 0, 0, 0)
  const startDate = new Date(thisMonday)
  startDate.setDate(thisMonday.getDate() - 15 * 7)

  const attemptsByDate = new Map<string, number>()
  for (const a of attempts) {
    if (!a.submitted_at) continue
    const d = new Date(a.submitted_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    attemptsByDate.set(key, (attemptsByDate.get(key) ?? 0) + 1)
  }

  const grid: number[][] = []
  for (let w = 0; w < 16; w++) {
    const week: number[] = []
    for (let d = 0; d < 7; d++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + w * 7 + d)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      const count = attemptsByDate.get(key) ?? 0
      week.push(count === 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : count <= 3 ? 3 : 4)
    }
    grid.push(week)
  }

  const activeDays = attemptsByDate.size

  return (
    <div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        <div className="flex flex-col shrink-0" style={{ gap: gap }}>
          {dayLabels.map((d, i) => (
            <div key={i} className="text-[10px] font-bold flex items-center"
                 style={{ color: 'var(--ink-muted)', height: cell, lineHeight: `${cell}px` }}>
              {i % 2 === 0 ? d : ''}
            </div>
          ))}
        </div>
        <div className="flex shrink-0" style={{ gap }}>
          {grid.map((week, w) => (
            <div key={w} className="flex flex-col" style={{ gap }}>
              {week.map((v, d) => (
                <div key={d} className="rounded-[3px]"
                     style={{
                       width: cell,
                       height: cell,
                       background: v === 0 ? 'var(--surface-2)' : `rgba(232, 93, 47, ${0.2 + v * 0.19})`,
                     }} />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3 mt-4 text-xs" style={{ color: 'var(--ink-muted)' }}>
        <span>Less</span>
        {[0, 1, 2, 3, 4].map(v => (
          <div key={v} className="w-3.5 h-3.5 rounded-[3px]"
               style={{ background: v === 0 ? 'var(--surface-2)' : `rgba(232, 93, 47, ${0.2 + v * 0.19})` }} />
        ))}
        <span>More</span>
        <span className="ml-auto">
          <span className="font-bold" style={{ color: 'var(--ink)' }}>{attempts.length} sessions</span>
          {activeDays > 0 && <> · <span className="font-bold" style={{ color: 'var(--ink)' }}>{activeDays} active day{activeDays !== 1 ? 's' : ''}</span></>}
        </span>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function StudentAnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: rawAttempts } = await supabase
    .from('attempts')
    .select('id, test_id, submitted_at, raw_score, total_questions, band_score, time_taken_seconds, tests(id, title, type)')
    .eq('student_id', user.id)
    .eq('is_completed', true)
    .order('submitted_at', { ascending: true })
    .limit(200)

  const attempts = (rawAttempts as AttemptRow[] | null) ?? []
  const recentAttempts = [...attempts].reverse().slice(0, 10)

  const reading = attempts.filter(a => a.tests?.type !== 'listening')
  const listening = attempts.filter(a => a.tests?.type === 'listening')

  const avg = (arr: AttemptRow[]) =>
    arr.length ? arr.reduce((s, a) => s + (a.band_score ?? 0), 0) / arr.length : null

  const avgBand = avg(attempts)
  const avgReading = avg(reading)
  const avgListening = avg(listening)
  const bestBand = attempts.length ? Math.max(...attempts.map(a => a.band_score ?? 0)) : null
  const totalTime = attempts.reduce((s, a) => s + (a.time_taken_seconds ?? 0), 0)

  // Band gain: avg of first 3 vs avg of last 3
  const firstThree = attempts.slice(0, 3)
  const lastThree = attempts.slice(-3)
  const bandGain =
    firstThree.length === 3 && lastThree.length === 3
      ? avg(lastThree)! - avg(firstThree)!
      : null

  // Strengths / Focus
  const strongerType =
    avgReading !== null && avgListening !== null
      ? avgReading >= avgListening ? 'Reading' : 'Listening'
      : avgReading !== null ? 'Reading' : avgListening !== null ? 'Listening' : null
  const weakerType = strongerType === 'Reading' ? 'Listening' : strongerType === 'Listening' ? 'Reading' : null
  const strongerBand = strongerType === 'Reading' ? avgReading : avgListening
  const weakerBand = weakerType === 'Reading' ? avgReading : avgListening

  return (
    <div className="py-8 px-10 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold leading-none" style={{ color: 'var(--ink)', fontFamily: 'Georgia, serif' }}>
            Analytics
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--ink-muted)' }}>
            {attempts.length} completed tests · your performance overview
          </p>
        </div>
        <Link href="/student/tests"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: 'var(--primary)' }}>
          Take a Test
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        {[
          { label: 'TESTS DONE', value: attempts.length, color: 'var(--ink)' },
          { label: 'AVG BAND', value: avgBand ? formatBandScore(avgBand) : '—', color: 'var(--primary)' },
          { label: 'BEST BAND', value: bestBand ? formatBandScore(bestBand) : '—', color: 'var(--accent)' },
          { label: 'TOTAL TIME', value: totalTime ? formatDuration(totalTime) : '—', color: 'var(--sky)' },
          {
            label: 'BAND GAIN',
            value: bandGain !== null ? (bandGain > 0 ? `+${bandGain.toFixed(1)}` : bandGain.toFixed(1)) : '—',
            color: bandGain !== null && bandGain > 0 ? 'var(--accent)' : bandGain !== null && bandGain < 0 ? 'var(--rose)' : 'var(--ink-muted)',
          },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1.5px solid var(--line)' }}>
            <div className="text-[10px] font-bold tracking-widest mb-1" style={{ color: 'var(--ink-muted)' }}>{s.label}</div>
            <div className="text-3xl font-bold leading-none" style={{ color: s.color, fontFamily: 'Georgia, serif' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Band chart */}
      <div className="rounded-2xl p-6 mb-6" style={{ background: 'var(--surface)', border: '1.5px solid var(--line)' }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--ink)', fontFamily: 'Georgia, serif' }}>Band Progression</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--ink-muted)' }}>All completed tests over time</p>
          </div>
          {(reading.length > 0 || listening.length > 0) && (
            <div className="flex items-center gap-4 text-xs">
              {reading.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full" style={{ background: 'var(--sky)' }} />
                  <span style={{ color: 'var(--ink-soft)' }}>Reading</span>
                  {avgReading && <span className="font-bold" style={{ color: 'var(--sky)' }}>{formatBandScore(avgReading)}</span>}
                </div>
              )}
              {listening.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full" style={{ background: 'var(--plum)' }} />
                  <span style={{ color: 'var(--ink-soft)' }}>Listening</span>
                  {avgListening && <span className="font-bold" style={{ color: 'var(--plum)' }}>{formatBandScore(avgListening)}</span>}
                </div>
              )}
            </div>
          )}
        </div>
        <BandChart attempts={attempts} />
      </div>

      {/* Heatmap + Type breakdown */}
      <div className="grid grid-cols-12 gap-6 mb-6">
        {/* Heatmap */}
        <div className="col-span-7 rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1.5px solid var(--line)' }}>
          <div className="mb-5">
            <h2 className="text-xl font-bold" style={{ color: 'var(--ink)', fontFamily: 'Georgia, serif' }}>Activity</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--ink-muted)' }}>Test sessions per day · last 16 weeks</p>
          </div>
          <ActivityHeatmap attempts={attempts} />
        </div>

        {/* Type breakdown */}
        <div className="col-span-5 rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1.5px solid var(--line)' }}>
          <h2 className="text-xl font-bold mb-5" style={{ color: 'var(--ink)', fontFamily: 'Georgia, serif' }}>By Type</h2>

          {/* Reading */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--sky)' }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Reading</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs" style={{ color: 'var(--ink-muted)' }}>{reading.length} tests</span>
                <span className="text-2xl font-bold" style={{ color: 'var(--sky)', fontFamily: 'Georgia, serif' }}>
                  {avgReading ? formatBandScore(avgReading) : '—'}
                </span>
              </div>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
              <div className="h-full rounded-full transition-all"
                   style={{ width: `${avgReading ? (avgReading / 9) * 100 : 0}%`, background: 'var(--sky)' }} />
            </div>
            <div className="flex justify-between text-[10px] mt-1 font-semibold" style={{ color: 'var(--ink-muted)' }}>
              <span>0</span><span>Band 9</span>
            </div>
          </div>

          {/* Listening */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--plum)' }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Listening</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs" style={{ color: 'var(--ink-muted)' }}>{listening.length} tests</span>
                <span className="text-2xl font-bold" style={{ color: 'var(--plum)', fontFamily: 'Georgia, serif' }}>
                  {avgListening ? formatBandScore(avgListening) : '—'}
                </span>
              </div>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
              <div className="h-full rounded-full transition-all"
                   style={{ width: `${avgListening ? (avgListening / 9) * 100 : 0}%`, background: 'var(--plum)' }} />
            </div>
            <div className="flex justify-between text-[10px] mt-1 font-semibold" style={{ color: 'var(--ink-muted)' }}>
              <span>0</span><span>Band 9</span>
            </div>
          </div>

          {/* Overall */}
          {attempts.length > 0 && (
            <div className="mt-5 pt-5" style={{ borderTop: '1px solid var(--line)' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-widest" style={{ color: 'var(--ink-muted)' }}>OVERALL AVG</span>
                <span className="text-3xl font-bold" style={{ color: 'var(--primary)', fontFamily: 'Georgia, serif' }}>
                  {avgBand ? formatBandScore(avgBand) : '—'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Strengths / Focus */}
      {strongerType && (
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="rounded-2xl p-6" style={{ background: 'var(--accent-soft)', border: '1.5px solid #9BC4AC' }}>
            <div className="flex items-center gap-2 mb-4">
              <span style={{ color: 'var(--accent)' }}><ChartUpIcon /></span>
              <h3 className="font-bold text-lg" style={{ color: 'var(--ink)', fontFamily: 'Georgia, serif' }}>You&apos;re stronger at</h3>
            </div>
            <div className="space-y-2.5">
              <div className="flex items-start gap-2">
                <span style={{ color: 'var(--accent)', marginTop: 2 }}><CheckIcon /></span>
                <div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                    {strongerType} — Band {strongerBand ? formatBandScore(strongerBand) : '—'}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--ink-soft)' }}>
                    {strongerType === 'Reading' ? reading.length : listening.length} tests completed
                  </div>
                </div>
              </div>
              {bandGain !== null && bandGain > 0 && (
                <div className="flex items-start gap-2">
                  <span style={{ color: 'var(--accent)', marginTop: 2 }}><ArrowUpIcon /></span>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Band improved by +{bandGain.toFixed(1)}</div>
                    <div className="text-xs" style={{ color: 'var(--ink-soft)' }}>Comparing first 3 vs last 3 tests</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {weakerType && weakerBand !== null && (
            <div className="rounded-2xl p-6" style={{ background: 'var(--rose-soft)', border: '1.5px solid #E4A5B3' }}>
              <div className="flex items-center gap-2 mb-4">
                <span style={{ color: 'var(--rose)' }}><TargetIcon /></span>
                <h3 className="font-bold text-lg" style={{ color: 'var(--ink)', fontFamily: 'Georgia, serif' }}>Focus area</h3>
              </div>
              <div className="space-y-2.5">
                <div className="flex items-start gap-2">
                  <div className="w-3.5 h-3.5 rounded-full mt-0.5 shrink-0 flex items-center justify-center" style={{ background: 'var(--rose)' }}>
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                      {weakerType} — Band {formatBandScore(weakerBand)}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--ink-soft)' }}>
                      {weakerType === 'Reading' ? reading.length : listening.length} tests · needs more practice
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <Link href="/student/tests"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80"
                        style={{ background: 'var(--rose)', color: 'white' }}>
                    Practice {weakerType} <ArrowRightIcon />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* If only one type done, fill right with CTA */}
          {!weakerType && (
            <div className="rounded-2xl p-6" style={{ background: 'var(--surface-2)', border: '1.5px solid var(--line)' }}>
              <div className="flex items-center gap-2 mb-4">
                <span style={{ color: 'var(--gold)' }}><BookIcon /></span>
                <h3 className="font-bold text-lg" style={{ color: 'var(--ink)', fontFamily: 'Georgia, serif' }}>Try the other type</h3>
              </div>
              <p className="text-sm mb-4" style={{ color: 'var(--ink-soft)' }}>
                You haven&apos;t taken any {strongerType === 'Reading' ? 'Listening' : 'Reading'} tests yet.
                Try one to get a full picture of your IELTS performance.
              </p>
              <Link href="/student/tests"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ background: 'var(--primary)' }}>
                Browse Tests <ArrowRightIcon />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {attempts.length === 0 && (
        <div className="rounded-2xl p-16 text-center" style={{ background: 'var(--surface)', border: '1.5px solid var(--line)' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
               style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
            <BookIcon />
          </div>
          <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--ink)', fontFamily: 'Georgia, serif' }}>No data yet</h3>
          <p className="text-sm mb-6" style={{ color: 'var(--ink-muted)' }}>Complete some tests to see your analytics here.</p>
          <Link href="/student/tests"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: 'var(--primary)' }}>
            Browse Tests <ArrowRightIcon />
          </Link>
        </div>
      )}

      {/* Recent sessions table */}
      {recentAttempts.length > 0 && (
        <div>
          <div className="flex items-end justify-between mb-4 mt-8">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--ink)', fontFamily: 'Georgia, serif' }}>Recent Sessions</h2>
            <Link href="/student/history"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold"
                  style={{ color: 'var(--primary)' }}>
              Full history <ArrowRightIcon />
            </Link>
          </div>
          <div className="rounded-2xl overflow-hidden" style={{ border: '1.5px solid var(--line)', background: 'var(--surface)' }}>
            <div className="grid gap-4 px-5 py-3 text-[10px] font-bold tracking-widest"
                 style={{ gridTemplateColumns: '1fr 100px 150px 80px 60px', color: 'var(--ink-muted)', borderBottom: '1.5px solid var(--line)' }}>
              <div>TEST</div><div>TYPE</div><div>DATE & TIME</div><div>SCORE</div><div>BAND</div>
            </div>
            {recentAttempts.map((attempt, i) => (
              <div key={attempt.id}
                   className="grid gap-4 px-5 py-4 items-center transition-colors hover:bg-[var(--surface-2)]"
                   style={{ gridTemplateColumns: '1fr 100px 150px 80px 60px', borderTop: i === 0 ? 'none' : '1px solid var(--line)' }}>
                <div className="text-sm font-semibold truncate" style={{ color: 'var(--ink)' }}>
                  {attempt.tests?.title ?? 'Unknown Test'}
                </div>
                <div>
                  <span className="inline-flex text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize"
                        style={{
                          background: attempt.tests?.type === 'listening' ? 'var(--plum-soft)' : 'var(--sky-soft)',
                          color: attempt.tests?.type === 'listening' ? 'var(--plum)' : 'var(--sky)',
                        }}>
                    {attempt.tests?.type}
                  </span>
                </div>
                <div>
                  <div className="text-sm" style={{ color: 'var(--ink-soft)' }}>{formatDate(attempt.submitted_at)}</div>
                  <div className="text-xs" style={{ color: 'var(--ink-muted)' }}>{formatClockTime(attempt.submitted_at)}</div>
                </div>
                <div className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                  {attempt.raw_score ?? '—'}/{attempt.total_questions ?? '—'}
                </div>
                <div>
                  <Link href={`/student/tests/${attempt.test_id}/result?attemptId=${attempt.id}`}
                        className="text-xl font-bold transition-opacity hover:opacity-70"
                        style={{ color: 'var(--primary)', fontFamily: 'Georgia, serif' }}>
                    {formatBandScore(attempt.band_score)}
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
