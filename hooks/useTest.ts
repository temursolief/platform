'use client'

import { useState, useCallback } from 'react'
import type { TestWithSections } from '@/lib/types'

interface UseTestState {
  answers: Record<string, string>
  currentSectionIndex: number
  attemptId: string | null
  isSubmitting: boolean
}

export function useTest(test: TestWithSections | null) {
  const [state, setState] = useState<UseTestState>({
    answers: {},
    currentSectionIndex: 0,
    attemptId: null,
    isSubmitting: false,
  })

  const setAnswer = useCallback((questionId: string, answer: string) => {
    setState((prev) => ({
      ...prev,
      answers: { ...prev.answers, [questionId]: answer },
    }))
  }, [])

  const setAttemptId = useCallback((id: string) => {
    setState((prev) => ({ ...prev, attemptId: id }))
  }, [])

  const goToSection = useCallback((index: number) => {
    setState((prev) => ({ ...prev, currentSectionIndex: index }))
  }, [])

  const nextSection = useCallback(() => {
    if (!test) return
    setState((prev) => ({
      ...prev,
      currentSectionIndex: Math.min(prev.currentSectionIndex + 1, test.sections.length - 1),
    }))
  }, [test])

  const prevSection = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentSectionIndex: Math.max(prev.currentSectionIndex - 1, 0),
    }))
  }, [])

  const setSubmitting = useCallback((value: boolean) => {
    setState((prev) => ({ ...prev, isSubmitting: value }))
  }, [])

  const currentSection = test?.sections[state.currentSectionIndex] ?? null

  const answeredCount = test
    ? test.sections
        .flatMap((s) => s.questions)
        .filter((q) => state.answers[q.id]?.trim()).length
    : 0

  const totalQuestions = test
    ? test.sections.flatMap((s) => s.questions).length
    : 0

  return {
    answers: state.answers,
    currentSectionIndex: state.currentSectionIndex,
    currentSection,
    attemptId: state.attemptId,
    isSubmitting: state.isSubmitting,
    answeredCount,
    totalQuestions,
    setAnswer,
    setAttemptId,
    goToSection,
    nextSection,
    prevSection,
    setSubmitting,
  }
}
