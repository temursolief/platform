import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatBandScore, formatDifficulty } from '@/lib/utils/format'

const BookIcon = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2V5Z"/><path d="M4 19a2 2 0 0 1 2-2h12"/>
  </svg>
)
const HeadphonesIcon = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 15v-3a8 8 0 0 1 16 0v3"/>
    <rect x="3" y="14" width="5" height="7" rx="1.5"/>
    <rect x="16" y="14" width="5" height="7" rx="1.5"/>
  </svg>
)
const ClockIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>
  </svg>
)
const ArrowRightIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6"/>
  </svg>
)
const CheckIcon = () => (
  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12l5 5 11-11"/>
  </svg>
)

export default async function StudentTestsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: tests }, { data: attempts }] = await Promise.all([
    supabase
      .from('tests')
      .select('id, title, type, difficulty, time_limit_minutes, total_questions, created_at')
      .eq('is_published', true)
      .order('created_at', { ascending: false }),
    supabase
      .from('attempts')
      .select('test_id, band_score, raw_score, total_questions, submitted_at')
      .eq('student_id', user.id)
      .eq('is_completed', true)
      .limit(200),
  ])

  const attemptMap = new Map(attempts?.map((a) => [a.test_id, a]) ?? [])
  const allTests = tests ?? []

  const readingTests = allTests.filter((t) => t.type !== 'listening')
  const listeningTests = allTests.filter((t) => t.type === 'listening')
  const completedCount = allTests.filter((t) => attemptMap.has(t.id)).length

  return (
    <div className="py-8 px-10 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold leading-none" style={{ color: 'var(--ink)', fontFamily: 'Georgia, serif' }}>
            Tests
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--ink-muted)' }}>
            Academic practice · {allTests.length} available
          </p>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'TOTAL TESTS', value: allTests.length, color: 'var(--ink)' },
          { label: 'COMPLETED', value: completedCount, color: 'var(--accent)' },
          { label: 'REMAINING', value: allTests.length - completedCount, color: 'var(--primary)' },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1.5px solid var(--line)' }}>
            <div className="text-[10px] font-bold tracking-widest mb-1" style={{ color: 'var(--ink-muted)' }}>{s.label}</div>
            <div className="text-4xl font-bold leading-none" style={{ color: s.color, fontFamily: 'Georgia, serif' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {!allTests.length ? (
        <div className="rounded-2xl p-16 text-center" style={{ background: 'var(--surface)', border: '1.5px solid var(--line)' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
               style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
            <BookIcon />
          </div>
          <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--ink)', fontFamily: 'Georgia, serif' }}>No tests available yet</h3>
          <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>Check back soon — your teacher will publish tests here.</p>
        </div>
      ) : (
        <>
          {/* Reading section */}
          {readingTests.length > 0 && (
            <section className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--sky-soft)', color: 'var(--sky)' }}>
                  <BookIcon />
                </div>
                <div>
                  <h2 className="text-xl font-bold" style={{ color: 'var(--ink)', fontFamily: 'Georgia, serif' }}>Reading</h2>
                  <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>{readingTests.length} tests</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {readingTests.map((test) => <TestCard key={test.id} test={test} attempt={attemptMap.get(test.id)} />)}
              </div>
            </section>
          )}

          {/* Listening section */}
          {listeningTests.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--plum-soft)', color: 'var(--plum)' }}>
                  <HeadphonesIcon />
                </div>
                <div>
                  <h2 className="text-xl font-bold" style={{ color: 'var(--ink)', fontFamily: 'Georgia, serif' }}>Listening</h2>
                  <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>{listeningTests.length} tests</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {listeningTests.map((test) => <TestCard key={test.id} test={test} attempt={attemptMap.get(test.id)} isListening />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}

// ─── TestCard ─────────────────────────────────────────────────────────────────
function TestCard({ test, attempt, isListening = false }: {
  test: { id: string; title: string; type: string; difficulty?: string; time_limit_minutes?: number; total_questions?: number }
  attempt?: { band_score: number | null; raw_score: number | null; total_questions: number | null; submitted_at: string } | null
  isListening?: boolean
}) {
  const done = !!attempt
  const accentColor = isListening ? 'var(--plum)' : 'var(--sky)'
  const accentSoft = isListening ? 'var(--plum-soft)' : 'var(--sky-soft)'

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5"
      style={{ background: 'var(--surface)', border: `1.5px solid ${done ? 'var(--accent)' : 'var(--line)'}` }}
    >
      {/* Status strip */}
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ background: 'var(--surface-2)', borderBottom: '1.5px solid var(--line)' }}
      >
        <span
          className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize"
          style={{ background: accentSoft, color: accentColor }}
        >
          {test.type}
        </span>
        {done ? (
          <span
            className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent-ink)' }}
          >
            <span className="w-4 h-4 rounded-full flex items-center justify-center text-white" style={{ background: 'var(--accent)' }}>
              <CheckIcon />
            </span>
            Band {formatBandScore(attempt?.band_score)}
          </span>
        ) : (
          <span
            className="inline-flex text-xs font-semibold px-2.5 py-0.5 rounded-full"
            style={{ background: 'var(--surface)', color: 'var(--ink-muted)', border: '1px solid var(--line)' }}
          >
            New
          </span>
        )}
      </div>

      <div className="p-5">
        <h3 className="text-xl font-bold leading-tight mb-3" style={{ color: 'var(--ink)', fontFamily: 'Georgia, serif' }}>
          {test.title}
        </h3>

        <div className="flex items-center gap-3 text-xs mb-4" style={{ color: 'var(--ink-muted)' }}>
          {test.time_limit_minutes && (
            <span className="flex items-center gap-1"><ClockIcon /> {test.time_limit_minutes} min</span>
          )}
          {test.total_questions && <span>· {test.total_questions} questions</span>}
          {test.difficulty && (
            <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold"
                  style={{ background: 'var(--gold-soft)', color: 'var(--gold-ink)' }}>
              {formatDifficulty(test.difficulty)}
            </span>
          )}
        </div>

        <Link
          href={`/student/tests/${test.id}`}
          className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
          style={{
            background: done ? 'var(--surface-2)' : 'var(--primary)',
            color: done ? 'var(--ink)' : 'white',
            border: done ? '1.5px solid var(--line)' : 'none',
          }}
        >
          {done ? 'Retry' : 'Start'}
          <ArrowRightIcon />
        </Link>
      </div>
    </div>
  )
}
