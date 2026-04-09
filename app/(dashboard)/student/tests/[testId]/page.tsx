import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TestInterface } from './TestInterface'

interface PageProps {
  params: Promise<{ testId: string }>
}

export default async function TestPage({ params }: PageProps) {
  const { testId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch user profile to check role
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const isTeacher = profile?.role === 'teacher' || profile?.role === 'admin'

  // Teachers can preview their own tests (even unpublished); students need is_published
  let testQuery = supabase
    .from('tests')
    .select(`*, sections(*, questions(*, options(*)))`)
    .eq('id', testId)

  if (isTeacher) {
    testQuery = testQuery.eq('teacher_id', user.id) as typeof testQuery
  } else {
    testQuery = testQuery.eq('is_published', true) as typeof testQuery
  }

  const { data: test } = await testQuery.single()

  if (!test) notFound()

  // Sort sections and questions by order_num
  test.sections = test.sections
    .sort((a: { order_num: number }, b: { order_num: number }) => a.order_num - b.order_num)
    .map((section: { questions: { order_num: number }[] }) => ({
      ...section,
      questions: section.questions.sort(
        (a: { order_num: number }, b: { order_num: number }) => a.order_num - b.order_num
      ),
    }))

  return <TestInterface test={test} userId={user.id} />
}
