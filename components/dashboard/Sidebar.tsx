'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@/lib/types'

// ─── Icon primitives ─────────────────────────────────────────────────────────
const Ico = ({ d, size = 18, fill = 'none' }: { d: string | string[]; size?: number; fill?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor"
       strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {(Array.isArray(d) ? d : [d]).map((p, i) => <path key={i} d={p} />)}
  </svg>
)

const HomeIcon = () => <Ico d="M3 10.5 12 3l9 7.5V20a1.5 1.5 0 0 1-1.5 1.5h-4V14h-5v7.5h-4A1.5 1.5 0 0 1 5 20v-9.5Z" />
const BookIcon = () => <Ico d={['M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2V5Z', 'M4 19a2 2 0 0 1 2-2h12']} />
const ClockIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>
  </svg>
)
const ChartIcon = () => <Ico d={['M3 3v18h18', 'M7 14l3-3 3 3 5-6']} />
const CardsIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>
  </svg>
)
const UsersIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="8" r="3.5"/>
    <circle cx="17" cy="10" r="2.5"/>
    <path d="M3 20c0-3 3-5 6-5s6 2 6 5M15 20c0-2 2-3.5 4-3.5s3 1 3 3"/>
  </svg>
)
const ClipboardIcon = () => <Ico d={['M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2', 'M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2Z', 'M9 12h6M9 16h4']} />
const LogOutIcon = () => <Ico d={['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5M21 12H9']} />
const SettingsIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>
  </svg>
)

// ─── Nav config ──────────────────────────────────────────────────────────────
interface NavItem { href: string; label: string; icon: React.ReactNode }

const studentNav: NavItem[] = [
  { href: '/student',            label: 'Dashboard', icon: <HomeIcon /> },
  { href: '/student/tests',      label: 'Tests',      icon: <BookIcon /> },
  { href: '/student/history',    label: 'History',    icon: <ClockIcon /> },
  { href: '/student/analytics',  label: 'Analytics',  icon: <ChartIcon /> },
  { href: '/student/vocabulary', label: 'Vocabulary',  icon: <CardsIcon /> },
]

const teacherNav: NavItem[] = [
  { href: '/teacher',          label: 'Dashboard',  icon: <HomeIcon /> },
  { href: '/teacher/tests',    label: 'Tests',       icon: <ClipboardIcon /> },
  { href: '/teacher/students', label: 'Students',    icon: <UsersIcon /> },
]

// ─── Component ───────────────────────────────────────────────────────────────
export function Sidebar({ profile }: { profile: User | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const isTeacher = profile?.role === 'teacher' || profile?.role === 'admin'
  const nav = isTeacher ? teacherNav : studentNav

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside
      className="flex flex-col w-[244px] shrink-0 h-screen sticky top-0"
      style={{ background: 'var(--surface)', borderRight: '1.5px solid var(--line)' }}
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 pt-6 pb-6">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xl text-white"
          style={{ background: 'var(--primary)' }}
        >
          I
        </div>
        <div>
          <div className="font-bold text-base leading-none" style={{ color: 'var(--ink)', fontFamily: 'Georgia, serif' }}>IELTS Pro</div>
          <div className="text-[10px] font-semibold tracking-widest mt-0.5" style={{ color: 'var(--ink-muted)' }}>
            {isTeacher ? 'TEACHER' : 'STUDENT'} VIEW
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 px-3 flex-1">
        {nav.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/student' && item.href !== '/teacher' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              style={{
                background: isActive ? 'var(--ink)' : 'transparent',
                color: isActive ? 'white' : 'var(--ink-soft)',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = 'var(--surface-2)'
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = 'transparent'
              }}
            >
              <span className={isActive ? 'text-white' : ''}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}

        {/* Admin: switch view */}
        {profile?.role === 'admin' && (
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--line)' }}>
            <p className="text-[10px] font-bold tracking-widest px-3 mb-1.5" style={{ color: 'var(--ink-muted)' }}>
              SWITCH VIEW
            </p>
            <Link
              href={isTeacher ? '/student' : '/teacher'}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              style={{ color: 'var(--ink-soft)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-2)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              <UsersIcon />
              {isTeacher ? 'Student View' : 'Teacher View'}
            </Link>
          </div>
        )}
      </nav>

      {/* Profile */}
      <div className="px-3 pb-5 mt-auto">
        <div
          className="flex items-center gap-3 p-3 rounded-2xl mb-2"
          style={{ background: 'var(--surface-2)', border: '1.5px solid var(--line)' }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
            style={{ background: 'var(--accent)' }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate leading-tight" style={{ color: 'var(--ink)' }}>
              {profile?.full_name || 'User'}
            </p>
            <p className="text-[11px] capitalize" style={{ color: 'var(--ink-muted)' }}>
              {profile?.role}
            </p>
          </div>
          <Link href="/settings" style={{ color: 'var(--ink-muted)' }} title="Settings">
            <SettingsIcon />
          </Link>
        </div>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors"
          style={{ color: 'var(--ink-muted)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--surface-2)'
            e.currentTarget.style.color = 'var(--ink)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--ink-muted)'
          }}
        >
          <LogOutIcon />
          Sign out
        </button>
      </div>
    </aside>
  )
}
