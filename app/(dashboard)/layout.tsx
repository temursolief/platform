import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ExamLayout } from '@/components/layout/ExamLayout'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch profile server-side — passed to Sidebar so there's no client-side waterfall
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return <ExamLayout profile={profile}>{children}</ExamLayout>
}
