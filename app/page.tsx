import Link from 'next/link'

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
const ChartIcon = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18"/><path d="M7 14l3-3 3 3 5-6"/>
  </svg>
)
const ClockIcon = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>
  </svg>
)
const CheckIcon = () => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12l5 5 11-11"/>
  </svg>
)
const CheckCircleIcon = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/><path d="M9 12l2 2 4-4"/>
  </svg>
)
const GradCapIcon = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
    <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/>
  </svg>
)
const FileIcon = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
  </svg>
)
const ArrowRightIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6"/>
  </svg>
)

const features = [
  {
    icon: <FileIcon />,
    title: 'Practice Passages',
    desc: 'Standalone reading passages published instantly for students to practise at their own pace.',
    color: 'var(--sky)',
    soft: 'var(--sky-soft)',
  },
  {
    icon: <BookIcon />,
    title: 'Reading Tests',
    desc: 'Academic passages with all IELTS question types: MCQ, T/F/NG, matching, sentence completion, and more.',
    color: 'var(--primary)',
    soft: 'var(--primary-soft)',
  },
  {
    icon: <ChartIcon />,
    title: 'Band Score Tracking',
    desc: 'Instant band scores using official IELTS conversion tables. Track improvement over time with detailed analytics.',
    color: 'var(--accent)',
    soft: 'var(--accent-soft)',
  },
  {
    icon: <ClockIcon />,
    title: 'Timed Practice',
    desc: 'Built-in countdown timer replicates real test conditions. Visual warnings as time runs low.',
    color: 'var(--gold)',
    soft: 'var(--gold-soft)',
  },
  {
    icon: <CheckCircleIcon />,
    title: 'Automatic Scoring',
    desc: 'Server-side answer checking with support for acceptable answer variations.',
    color: 'var(--rose)',
    soft: 'var(--rose-soft)',
  },
  {
    icon: <GradCapIcon />,
    title: 'Teacher Tools',
    desc: 'Upload tests via JSON, manage student progress, and view per-question analytics.',
    color: 'var(--plum)',
    soft: 'var(--plum-soft)',
  },
]

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--ink)' }}>
      {/* Navigation */}
      <header style={{ borderBottom: '1.5px solid var(--line)', background: 'var(--surface)' }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xl text-white"
              style={{ background: 'var(--primary)' }}
            >
              I
            </div>
            <span className="font-bold text-xl" style={{ color: 'var(--ink)', fontFamily: 'Georgia, serif' }}>
              IELTS Pro
            </span>
          </div>
          <Link
            href="/login"
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: 'var(--primary)' }}
          >
            Sign in
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center relative">
        {/* Decorative background blobs */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(232,132,107,0.08) 0%, transparent 70%)',
          }}
        />
        <div className="relative">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-8"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent-ink)' }}
          >
            <CheckIcon />
            Authentic IELTS-format practice tests
          </div>
          <h1
            className="text-6xl font-bold max-w-2xl mx-auto leading-tight"
            style={{ color: 'var(--ink)', fontFamily: 'Georgia, serif' }}
          >
            Prepare for IELTS<br />with confidence
          </h1>
          <p className="text-xl mt-6 max-w-xl mx-auto leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
            Practice Listening and Reading tests in an exam-like environment.
            Automatic scoring, instant band scores, and detailed progress tracking.
          </p>
          <div className="flex items-center justify-center gap-4 mt-10">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: 'var(--primary)' }}
            >
              Get Started — It&apos;s Free <ArrowRightIcon />
            </Link>
            <Link
              href="#features"
              className="px-8 py-3.5 rounded-xl text-base font-semibold transition-all hover:-translate-y-0.5"
              style={{ border: '1.5px solid var(--line-2)', color: 'var(--ink-soft)', background: 'var(--surface)' }}
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 pb-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold" style={{ color: 'var(--ink)', fontFamily: 'Georgia, serif' }}>
            Everything you need to succeed
          </h2>
          <p className="text-base mt-3" style={{ color: 'var(--ink-muted)' }}>
            Built for serious IELTS preparation
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl p-6 transition-all hover:-translate-y-0.5"
              style={{
                background: 'var(--surface)',
                border: '1.5px solid var(--line)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                style={{ background: feature.soft, color: feature.color }}
              >
                {feature.icon}
              </div>
              <h3
                className="font-bold text-lg mb-2"
                style={{ color: 'var(--ink)', fontFamily: 'Georgia, serif' }}
              >
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div
          className="rounded-3xl p-12 text-center relative overflow-hidden"
          style={{ background: 'var(--ink)', color: 'white' }}
        >
          <svg className="absolute right-0 top-0 pointer-events-none opacity-[0.06]" width="400" height="280" viewBox="0 0 400 280">
            {[...Array(5)].map((_, i) => (
              <circle key={i} cx="370" cy="50" r={60 + i * 45} fill="none" stroke="white" strokeWidth="1.5" />
            ))}
          </svg>
          <div className="relative">
            <h2 className="text-4xl font-bold mb-4 leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
              Ready to improve your band score?
            </h2>
            <p className="text-base mb-8 max-w-md mx-auto" style={{ color: 'rgba(255,255,255,0.65)' }}>
              Join students already practising with authentic IELTS-format tests and detailed analytics.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold transition-opacity hover:opacity-90"
              style={{ background: 'var(--primary)', color: 'white' }}
            >
              Start practising free <ArrowRightIcon />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1.5px solid var(--line)' }}>
        <div className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white"
              style={{ background: 'var(--primary)', fontSize: '12px' }}
            >
              I
            </div>
            <span className="text-sm font-semibold" style={{ color: 'var(--ink-muted)', fontFamily: 'Georgia, serif' }}>
              IELTS Pro
            </span>
          </div>
          <p className="text-xs" style={{ color: 'var(--ink-faint)' }}>
            For practice purposes only. Not affiliated with the British Council, IDP, or Cambridge Assessment English.
          </p>
        </div>
      </footer>
    </div>
  )
}
