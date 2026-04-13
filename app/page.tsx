import Link from 'next/link'
import { GraduationCap, BookOpen, BarChart2, Clock, CheckCircle2, FileText } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <header className="border-b border-neutral-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap size={24} className="text-neutral-900" />
            <span className="font-bold text-neutral-900 text-xl">IELTS Pro</span>
          </div>
          <Link
            href="/login"
            className="bg-neutral-900 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-neutral-100 text-neutral-600 text-sm px-4 py-1.5 rounded-full mb-8">
          <CheckCircle2 size={14} className="text-emerald-600" />
          Authentic IELTS-format practice tests
        </div>
        <h1 className="text-5xl font-bold text-neutral-900 tracking-tight max-w-2xl mx-auto leading-tight">
          Prepare for IELTS with confidence
        </h1>
        <p className="text-xl text-neutral-500 mt-6 max-w-xl mx-auto leading-relaxed">
          Practice Listening and Reading tests in an exam-like environment.
          Automatic scoring, instant band scores, and detailed progress tracking.
        </p>
        <div className="flex items-center justify-center gap-4 mt-10">
          <Link
            href="/login"
            className="bg-neutral-900 text-white px-8 py-3 rounded-lg text-base font-medium hover:bg-neutral-800 transition-colors"
          >
            Get Started — It&apos;s Free
          </Link>
          <Link
            href="#features"
            className="text-neutral-600 px-8 py-3 rounded-lg text-base font-medium hover:bg-neutral-50 border border-neutral-200 transition-colors"
          >
            Learn More
          </Link>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: <FileText size={24} />,
              title: 'Practice Passages',
              desc: 'Standalone reading passages published instantly for students to practise at their own pace.',
            },
            {
              icon: <BookOpen size={24} />,
              title: 'Reading Tests',
              desc: 'Academic passages with all IELTS question types: MCQ, T/F/NG, matching, sentence completion, and more.',
            },
            {
              icon: <BarChart2 size={24} />,
              title: 'Band Score Tracking',
              desc: 'Instant band scores using official IELTS conversion tables. Track improvement over time.',
            },
            {
              icon: <Clock size={24} />,
              title: 'Timed Practice',
              desc: 'Built-in countdown timer replicates real test conditions. Visual warnings as time runs low.',
            },
            {
              icon: <CheckCircle2 size={24} />,
              title: 'Automatic Scoring',
              desc: 'Server-side answer checking with support for acceptable answer variations.',
            },
            {
              icon: <GraduationCap size={24} />,
              title: 'Teacher Tools',
              desc: 'Upload tests via JSON, manage student progress, and view per-question analytics.',
            },
          ].map((feature) => (
            <div key={feature.title} className="p-6 border border-neutral-200 rounded-xl hover:border-neutral-400 transition-colors">
              <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center mb-4 text-neutral-700">
                {feature.icon}
              </div>
              <h3 className="font-semibold text-neutral-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-neutral-500 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-100 py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap size={18} className="text-neutral-400" />
            <span className="text-sm text-neutral-400">IELTS Pro</span>
          </div>
          <p className="text-xs text-neutral-400">
            For practice purposes only. Not affiliated with the British Council, IDP, or Cambridge Assessment English.
          </p>
        </div>
      </footer>
    </div>
  )
}
