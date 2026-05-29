import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate, formatDifficulty } from '@/lib/utils/format'

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
const PlusIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14"/>
  </svg>
)
const EditIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3l4 4-12 12H5v-4L17 3Z"/>
  </svg>
)
const ChartIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18"/><path d="M7 14l3-3 3 3 5-6"/>
  </svg>
)
const ClockIcon = () => (
  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>
  </svg>
)

export default async function TeacherTestsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tests } = await supabase
    .from('tests')
    .select('*')
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false })

  const published = tests?.filter((t) => t.is_published) ?? []
  const drafts = tests?.filter((t) => !t.is_published) ?? []

  return (
    <div className="py-8 px-10 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold leading-none" style={{ color: 'var(--ink)', fontFamily: 'Georgia, serif' }}>
            Tests
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--ink-muted)' }}>
            {tests?.length ?? 0} total · {published.length} published
          </p>
        </div>
        <Link
          href="/teacher/tests/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: 'var(--primary)' }}
        >
          <PlusIcon /> New Test
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'TOTAL TESTS', value: tests?.length ?? 0, color: 'var(--ink)', bg: 'var(--surface)' },
          { label: 'PUBLISHED', value: published.length, color: 'var(--accent-ink)', bg: 'var(--accent-soft)' },
          { label: 'DRAFTS', value: drafts.length, color: 'var(--gold-ink)', bg: 'var(--gold-soft)' },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl p-5" style={{ background: s.bg, border: '1.5px solid var(--line)' }}>
            <div className="text-[10px] font-bold tracking-widest mb-1" style={{ color: 'var(--ink-muted)' }}>{s.label}</div>
            <div className="text-4xl font-bold leading-none" style={{ color: s.color, fontFamily: 'Georgia, serif' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {!tests?.length ? (
        <div className="rounded-2xl p-16 text-center" style={{ background: 'var(--surface)', border: '1.5px solid var(--line)' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
               style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
            <BookIcon />
          </div>
          <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--ink)', fontFamily: 'Georgia, serif' }}>No tests yet</h3>
          <p className="text-sm mb-6" style={{ color: 'var(--ink-muted)' }}>Create and publish your first test for students to take.</p>
          <Link href="/teacher/tests/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: 'var(--primary)' }}>
            <PlusIcon /> Create Test
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: '1.5px solid var(--line)', background: 'var(--surface)' }}>
          {/* Table header */}
          <div className="grid gap-4 px-5 py-3 text-[10px] font-bold tracking-widest"
               style={{ gridTemplateColumns: '1fr 100px 80px 80px 80px 140px', color: 'var(--ink-muted)', borderBottom: '1.5px solid var(--line)' }}>
            <div>TITLE</div>
            <div>TYPE</div>
            <div>QUESTIONS</div>
            <div>TIME</div>
            <div>STATUS</div>
            <div>ACTIONS</div>
          </div>

          {tests.map((test, i) => (
            <div
              key={test.id}
              className="grid gap-4 px-5 py-4 items-center transition-colors hover:bg-[var(--surface-2)]"
              style={{ gridTemplateColumns: '1fr 100px 80px 80px 80px 140px', borderTop: i === 0 ? 'none' : '1px solid var(--line)' }}
            >
              {/* Title + meta */}
              <div>
                <div className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{test.title}</div>
                <div className="flex items-center gap-2 mt-0.5 text-xs" style={{ color: 'var(--ink-muted)' }}>
                  <span>{formatDate(test.created_at)}</span>
                  {test.difficulty && (
                    <>
                      <span>·</span>
                      <span style={{ color: 'var(--gold-ink)' }}>{formatDifficulty(test.difficulty)}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Type */}
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize"
                      style={{
                        background: test.type === 'listening' ? 'var(--plum-soft)' : 'var(--sky-soft)',
                        color: test.type === 'listening' ? 'var(--plum)' : 'var(--sky)',
                      }}>
                  {test.type === 'listening' ? <HeadphonesIcon /> : <BookIcon />}
                  {test.type}
                </span>
              </div>

              {/* Questions */}
              <div className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                {test.total_questions}
              </div>

              {/* Time */}
              <div className="flex items-center gap-1 text-sm" style={{ color: 'var(--ink-soft)' }}>
                <ClockIcon /> {test.time_limit_minutes}m
              </div>

              {/* Status */}
              <div>
                <span className="inline-flex text-xs font-semibold px-2.5 py-0.5 rounded-full"
                      style={{
                        background: test.is_published ? 'var(--accent-soft)' : 'var(--surface-2)',
                        color: test.is_published ? 'var(--accent-ink)' : 'var(--ink-muted)',
                      }}>
                  {test.is_published ? 'Published' : 'Draft'}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Link
                  href={`/teacher/tests/${test.id}/analytics`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:bg-[var(--surface-2)]"
                  style={{ border: '1.5px solid var(--line)', color: 'var(--ink-soft)' }}
                >
                  <ChartIcon /> Analytics
                </Link>
                <Link
                  href={`/teacher/tests/${test.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:opacity-80"
                  style={{ background: 'var(--primary-soft)', color: 'var(--primary-ink)' }}
                >
                  <EditIcon /> Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
