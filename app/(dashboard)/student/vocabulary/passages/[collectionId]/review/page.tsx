import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PassageReviewClient } from '../../PassageReviewClient'

interface Props {
  params: Promise<{ collectionId: string }>
}

export default async function CollectionReviewPage({ params }: Props) {
  const { collectionId } = await params

  // Fetch collection title server-side for the page header
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: collection } = await supabase
    .from('passage_flashcard_collections')
    .select('title, sections!inner(tests!inner(title))')
    .eq('id', collectionId)
    .single()

  const collTitle = collection?.title ?? 'Passage'
  const secRaw = collection?.sections as unknown
  const sec = (Array.isArray(secRaw) ? secRaw[0] : secRaw) as { tests: { title: string } | { title: string }[] } | null
  const testsRaw = sec?.tests
  const tests = testsRaw ? (Array.isArray(testsRaw) ? testsRaw[0] : testsRaw) as { title: string } : null
  const testTitle = tests?.title ?? ''

  return (
    <div className="py-8 px-10 max-w-[900px]">
      <PassageReviewClient
        fetchUrl={`/api/vocabulary/passage-collections/${collectionId}`}
        filterDue
        collectionTitle={collTitle}
        backHref="/student/vocabulary/passages"
        backLabel="Passage Flashcards"
        backCrumbs={[
          { label: 'Vocabulary', href: '/student/vocabulary' },
          { label: 'Passage Flashcards', href: '/student/vocabulary/passages' },
          { label: testTitle || collTitle, href: '/student/vocabulary/passages' },
        ]}
      />
    </div>
  )
}
