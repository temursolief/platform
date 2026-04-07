import type { Question } from '@/lib/types'

interface CheckResult {
  isCorrect: boolean
  normalizedGiven: string
  normalizedExpected: string
}

export function checkAnswer(question: Question, givenAnswer: string): CheckResult {
  const normalized = normalizeAnswer(givenAnswer)
  const expectedNormalized = normalizeAnswer(question.correct_answer)

  if (normalized === expectedNormalized) {
    return { isCorrect: true, normalizedGiven: normalized, normalizedExpected: expectedNormalized }
  }

  // Check acceptable alternatives
  if (question.acceptable_answers?.length) {
    const isAcceptable = question.acceptable_answers.some(
      (alt) => normalizeAnswer(alt) === normalized
    )
    if (isAcceptable) {
      return { isCorrect: true, normalizedGiven: normalized, normalizedExpected: expectedNormalized }
    }
  }

  return { isCorrect: false, normalizedGiven: normalized, normalizedExpected: expectedNormalized }
}

function normalizeAnswer(answer: string): string {
  return answer
    .toLowerCase()
    .trim()
    .replace(/^(a|an|the)\s+/i, '')
    .replace(/\s+/g, ' ')
    .replace(/[.,!?;:'"()]/g, '')
    .replace(/&/g, 'and')
    .replace(/(\w+)(s|es)$/i, '$1')
}

export function scoreTest(
  questions: Question[],
  answers: Record<string, string>
): { rawScore: number; results: Record<string, boolean> } {
  const results: Record<string, boolean> = {}
  let rawScore = 0

  for (const question of questions) {
    const givenAnswer = answers[question.id] || ''
    const { isCorrect } = checkAnswer(question, givenAnswer)
    results[question.id] = isCorrect
    if (isCorrect) rawScore++
  }

  return { rawScore, results }
}
