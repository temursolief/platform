import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatBandScore, formatDate, formatClockTime, formatScore } from '@/lib/utils/format'
import { formatDuration } from '@/lib/utils/time'

const ChevronLeftIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 18l-6-6 6-6"/>
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
const ClockIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>
  </svg>
)
const CheckIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/><path d="M9 12l2 2 4-4"/>
  </svg>
)

function bandToColor(band: number): string {
  if (band >= 8) return 'var(--accent)'
  if (band >= 7) return 'var(--sky)'
  if (band >= 6) return 'var(--primary)'
  return 'var(--rose)'
}

interface PageProps {
  params: Promise<{ testId: string }>
}

export default async function TestAnalyticsPage({ params }: PageProps) {
  const { testId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  type AttemptRow = {
    id: string; student_id: string; submitted_at: string
    raw_score: number | null; total_questions: number | null
    band_score: number | null; time_taken_seconds: number | null
    users: { full_name: string | null; email: string } | null
  }

  const [{ data: test }, { data: rawAttempts }] = await Promise.all([
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
  const attempts = rawAttempts as AttemptRow[] | null

  if (!test) notFound()

  const attemptIds = (attempts ?? []).map((a) => a.id)
  const { data: answers } = attemptIds.length
    ? await supabase
        .from('answers')
        .select('question_id, is_correct, attempt_id')
        .in('attempt_id', attemptIds)
    : { data: [] }

  const allQuestions = (test.sections ?? [])
    .sort((a: { order_num: number }, b: { order_num: number }) => a.order_num - b.order_num)
    .flatMap((s: { questions: { id: string; order_num: number; question_text: string }[] }) => s.questions)

  interface QuestionStat { id: string; order_num: number; question_text: string; correct: number; total: number; rate: number | null }
  const questionStats: QuestionStat[] = allQuestions.map((q: { id: string; order_num: number; question_text: string }) => {
    const qAnswers = (answers ?? []).filter((a) => a.question_id === q.id)
    const correct = qAnswers.filter((a) => a.is_correct).length
    const total = qAnswers.length
    return { id: q.id, order_num: q.order_num, question_text: q.question_text, correct, total, rate: total ? Math.round((correct / total) * 100) : null }
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

  const bandBuckets = [4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9]
  const bandCounts = bandBuckets.map(b => ({
    band: b,
    count: (attempts ?? []).filter(a => a.band_score === b).length,
  }))
  const maxCount = Math.max(...bandCounts.map(b => b.count), 1)

  return (
    <div className="py-8 px-10 max-w-[1200px]">
      {/* Back + header */}
      <div className="mb-8">
        <Link
          href={`/teacher/tests/${testId}`}
          className="inline-flex items-center gap-1 text-sm font-semibold mb-4 transition-opacity hover:opacity-70"
          style={{ color: 'var(--ink-muted)' }}
        >
          <ChevronLeftIcon /> Back to Test
        </Link>
        <h1 className="text-4xl font-bold leading-none" style={{ color: 'var(--ink)', fontFamily: 'Georgia, serif' }}>
          {test.title}
        </h1>
        <p className="text-sm mt-2" style={{ color: 'var(--ink-muted)' }}>Analytics &amp; Student Performance</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'ATTEMPTS', value: totalAttempts, color: 'var(--ink)', bg: 'var(--surface)', icon: <UsersIcon /> },
          { label: 'AVG BAND SCORE', value: avgBand ? formatBandScore(avgBand) : '—', color: 'var(--primary)', bg: 'var(--primary-soft)', icon: <ChartIcon /> },
          { label: 'AVG RAW SCORE', value: avgScore !== null ? `${avgScore}/${test.total_questions}` : '—', color: 'var(--accent-ink)', bg: 'var(--accent-soft)', icon: <CheckIcon /> },
          { label: 'AVG TIME TAKEN', value: avgTime ? formatDuration(avgTime) : '—', color: 'var(--gold-ink)', bg: 'var(--gold-soft)', icon: <ClockIcon /> },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-5" style={{ background: s.bg, border: '1.5px solid var(--line)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] font-bold tracking-widest" style={{ color: 'var(--ink-muted)' }}>{s.label}</div>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.6)', color: s.color }}>
                {s.icon}
              </div>
            </div>
            <div className="text-4xl font-bold leading-none" style={{ color: s.color, fontFamily: 'Georgia, serif' }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6 mb-6">
        {/* Student results */}
        <div className="col-span-7">
          <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--ink)', fontFamily: 'Georgia, serif' }}>Student Results</h2>
          <div className="rounded-2xl overflow-hidden" style={{ border: '1.5px solid var(--line)', background: 'var(--surface)' }}>
            {!totalAttempts ? (
              <div className="py-12 text-center">
                <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>No attempts yet</p>
              </div>
            ) : (
              <>
                <div className="grid gap-4 px-5 py-3 text-[10px] font-bold tracking-widest"
                     style={{ gridTemplateColumns: '1fr 150px 80px 60px', color: 'var(--ink-muted)', borderBottom: '1.5px solid var(--line)' }}>
                  <div>STUDENT</div><div>DATE &amp; TIME</div><div>SCORE</div><div>BAND</div>
                </div>
                {attempts!.map((attempt, i) => {
                  const initials = attempt.users?.full_name
                    ? attempt.users.full_name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
                    : attempt.users?.email?.[0]?.toUpperCase() || '?'
                  return (
                    <div key={attempt.id}
                         className="grid gap-4 px-5 py-4 items-center transition-colors hover:bg-[var(--surface-2)]"
                         style={{ gridTemplateColumns: '1fr 150px 80px 60px', borderTop: i === 0 ? 'none' : '1px solid var(--line)' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0"
                             style={{ background: 'var(--accent)' }}>
                          {initials}
                        </div>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                            {attempt.users?.full_name || attempt.users?.email || 'Unknown'}
                          </p>
                          {attempt.time_taken_seconds && (
                            <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                              {formatDuration(attempt.time_taken_seconds)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm" style={{ color: 'var(--ink-soft)' }}>{formatDate(attempt.submitted_at)}</div>
                        <div className="text-xs" style={{ color: 'var(--ink-muted)' }}>{formatClockTime(attempt.submitted_at)}</div>
                      </div>
                      <div className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                        {formatScore(attempt.raw_score, attempt.total_questions)}
                      </div>
                      <div>
                        <span className="text-2xl font-bold" style={{ color: bandToColor(attempt.band_score ?? 0), fontFamily: 'Georgia, serif' }}>
                          {formatBandScore(attempt.band_score)}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </>
            )}
          </div>
        </div>

        {/* Question difficulty */}
        <div className="col-span-5">
          <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--ink)', fontFamily: 'Georgia, serif' }}>Question Difficulty</h2>
          <div className="rounded-2xl p-5 max-h-[520px] overflow-y-auto"
               style={{ background: 'var(--surface)', border: '1.5px solid var(--line)' }}>
            {!totalAttempts ? (
              <p className="text-sm text-center py-4" style={{ color: 'var(--ink-muted)' }}>No data yet</p>
            ) : (
              <div className="space-y-4">
                {questionStats.map((qs) => {
                  const acc = qs.rate ?? 0
                  const barColor = acc >= 70 ? 'var(--accent)' : acc >= 40 ? 'var(--gold)' : 'var(--rose)'
                  const textColor = acc >= 70 ? 'var(--accent-ink)' : acc >= 40 ? 'var(--gold-ink)' : 'var(--rose)'
                  return (
                    <div key={qs.id}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold truncate max-w-[180px]" style={{ color: 'var(--ink)' }}>
                          Q{qs.order_num}. {qs.question_text.substring(0, 38)}{qs.question_text.length > 38 ? '…' : ''}
                        </span>
                        <span className="text-xs font-bold ml-2 shrink-0" style={{ color: textColor }}>
                          {qs.rate !== null ? `${qs.rate}%` : '—'}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
                        <div className="h-full rounded-full transition-all"
                             style={{ width: `${acc}%`, background: barColor }} />
                      </div>
                      <div className="text-[10px] mt-0.5" style={{ color: 'var(--ink-muted)' }}>
                        {qs.correct}/{qs.total} correct
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Band distribution chart */}
      {totalAttempts > 0 && (
        <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1.5px solid var(--line)' }}>
          <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--ink)', fontFamily: 'Georgia, serif' }}>Band Distribution</h2>
          <div className="flex items-end gap-2" style={{ height: '140px' }}>
            {bandCounts.map(({ band, count }) => {
              const pct = (count / maxCount) * 100
              const color = bandToColor(band)
              return (
                <div key={band} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-semibold" style={{ color: count > 0 ? 'var(--ink)' : 'transparent' }}>
                    {count > 0 ? count : ''}
                  </span>
                  <div className="w-full rounded-t-lg transition-all"
                       style={{
                         height: count > 0 ? `${Math.max(pct, 8)}%` : '0%',
                         background: color,
                         opacity: 0.85,
                         minHeight: count > 0 ? '6px' : '0',
                       }}
                       title={`Band ${band}: ${count} student${count !== 1 ? 's' : ''}`}
                  />
                  <span className="text-[10px] font-bold" style={{ color: 'var(--ink-muted)' }}>{band}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
