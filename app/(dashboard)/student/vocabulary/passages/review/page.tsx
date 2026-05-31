import { PassageReviewClient } from '../PassageReviewClient'

export default function ReviewAllPassageFlashcardsPage() {
  return (
    <div className="py-8 px-10 max-w-[900px]">
      <PassageReviewClient
        fetchUrl="/api/vocabulary/passage-collections/review"
        backHref="/student/vocabulary/passages"
        backLabel="Passage Flashcards"
        backCrumbs={[
          { label: 'Vocabulary', href: '/student/vocabulary' },
          { label: 'Passage Flashcards', href: '/student/vocabulary/passages' },
        ]}
      />
    </div>
  )
}
