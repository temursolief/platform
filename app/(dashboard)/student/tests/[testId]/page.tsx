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

  // Fetch the test with all sections and questions
  const { data: test } = await supabase
    .from('tests')
    .select(`
      *,
      sections (
        *,
        questions (
          *,
          options (*)
        )
      )
    `)
    .eq('id', testId)
    .eq('is_published', true)
    .single()

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
