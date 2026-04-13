'use client'

import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/dashboard/Sidebar'
import type { User } from '@/lib/types'

interface ExamLayoutProps {
  profile: User | null
  children: React.ReactNode
}

// Routes that suppress the sidebar (active exam, full-screen mode)
const EXAM_PATTERN = /^\/student\/tests\/[^/]+$/

export function ExamLayout({ profile, children }: ExamLayoutProps) {
  const pathname = usePathname()
  const isExam = EXAM_PATTERN.test(pathname)

  return (
    <div className="flex h-screen bg-neutral-50">
      {!isExam && <Sidebar profile={profile} />}
      <main className={`flex-1 min-w-0 ${isExam ? 'overflow-hidden' : 'overflow-y-auto'}`}>
        {children}
      </main>
    </div>
  )
}
