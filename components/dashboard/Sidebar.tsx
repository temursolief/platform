'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut, LayoutDashboard, BookOpen, History, Users, ClipboardList, BarChart2, GraduationCap } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

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

export function Sidebar() {
  const pathname = usePathname()
  const { profile, signOut } = useAuth()

  const isTeacher = profile?.role === 'teacher' || profile?.role === 'admin'
  const navItems = isTeacher ? teacherNav : studentNav

  return (
    <aside className="w-60 min-h-screen bg-white border-r border-neutral-200 flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-neutral-200">
        <div className="flex items-center gap-2">
          <GraduationCap size={22} className="text-neutral-900" />
          <span className="font-bold text-neutral-900 text-lg">IELTS Pro</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4">
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/student' && item.href !== '/teacher' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            )
          })}
        </div>

        {/* Role switcher for admin */}
        {profile?.role === 'admin' && (
          <div className="mt-4 pt-4 border-t border-neutral-100">
            <p className="text-xs text-neutral-400 px-3 mb-2">Switch view</p>
            <Link
              href={isTeacher ? '/student' : '/teacher'}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-neutral-600 hover:bg-neutral-100"
            >
              <BarChart2 size={18} />
              {isTeacher ? 'Student View' : 'Teacher View'}
            </Link>
          </div>
        )}
      </nav>

      {/* User Profile */}
      <div className="px-3 pb-4 border-t border-neutral-200 mt-auto pt-4">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next-eslint/no-img-element
            <img
              src={profile.avatar_url}
              alt={profile.full_name || ''}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center text-sm font-medium">
              {profile?.full_name?.[0]?.toUpperCase() || '?'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-neutral-900 truncate">
              {profile?.full_name || 'User'}
            </p>
            <p className="text-xs text-neutral-500 capitalize">{profile?.role}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-neutral-600 hover:bg-neutral-100 w-full"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
