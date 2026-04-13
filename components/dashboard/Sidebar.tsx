'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut, LayoutDashboard, BookOpen, History, Users, ClipboardList, BarChart2, GraduationCap } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@/lib/types'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
}

const studentNav: NavItem[] = [
  { href: '/student', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { href: '/student/tests', label: 'Available Tests', icon: <BookOpen size={18} /> },
  { href: '/student/history', label: 'My History', icon: <History size={18} /> },
]

const teacherNav: NavItem[] = [
  { href: '/teacher', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { href: '/teacher/tests', label: 'Manage Tests', icon: <ClipboardList size={18} /> },
  { href: '/teacher/students', label: 'Students', icon: <Users size={18} /> },
]

interface SidebarProps {
  profile: User | null
}

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const isTeacher = profile?.role === 'teacher' || profile?.role === 'admin'
  const navItems = isTeacher ? teacherNav : studentNav

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-60 h-screen bg-white border-r border-neutral-200 flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-neutral-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-neutral-900 rounded-lg flex items-center justify-center">
            <GraduationCap size={16} className="text-white" />
          </div>
          <span className="font-bold text-neutral-900 text-base tracking-tight">IELTS Pro</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/student' && item.href !== '/teacher' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
            >
              <span className={isActive ? 'text-white' : 'text-neutral-400'}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}

        {profile?.role === 'admin' && (
          <div className="mt-4 pt-4 border-t border-neutral-100">
            <p className="text-[11px] text-neutral-400 px-3 mb-1.5 uppercase tracking-wide font-medium">Switch view</p>
            <Link
              href={isTeacher ? '/student' : '/teacher'}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
            >
              <span className="text-neutral-400"><BarChart2 size={18} /></span>
              {isTeacher ? 'Student View' : 'Teacher View'}
            </Link>
          </div>
        )}
      </nav>

      {/* User Profile */}
      <div className="px-3 pb-4 border-t border-neutral-100 pt-3">
        <div className="flex items-center gap-3 px-3 py-2 mb-0.5 rounded-lg">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.full_name || ''}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-neutral-100"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
              {profile?.full_name?.[0]?.toUpperCase() || '?'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-neutral-900 truncate leading-tight">
              {profile?.full_name || 'User'}
            </p>
            <p className="text-xs text-neutral-400 capitalize">{profile?.role}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 w-full transition-colors"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
