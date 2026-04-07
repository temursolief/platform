'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { GraduationCap, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react'
import type { TestWithSections } from '@/lib/types'
import { useTest } from '@/hooks/useTest'
import { useTimer } from '@/hooks/useTimer'
import { TimerDisplay } from '@/components/ui/timer'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { AudioPlayer } from '@/components/test/AudioPlayer'
import { PassageViewer } from '@/components/test/PassageViewer'
import { QuestionCard } from '@/components/test/QuestionCard'
import { AnswerSheet } from '@/components/test/AnswerSheet'
import { minutesToSeconds } from '@/lib/utils/time'

interface TestInterfaceProps {
  test: TestWithSections
  userId: string
}

export function TestInterface({ test, userId }: TestInterfaceProps) {
  const router = useRouter()
  const [started, setStarted] = useState(false)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    answers,
    currentSectionIndex,
    currentSection,
    attemptId,
    isSubmitting,
    answeredCount,
    totalQuestions,
    setAnswer,
    setAttemptId,
    goToSection,
    nextSection,
    prevSection,
    setSubmitting,
  } = useTest(test)

  const timer = useTimer({
    initialSeconds: minutesToSeconds(test.time_limit_minutes),
    autoStart: false,
    onExpire: () => handleSubmit(true),
  })

  const startTest = async () => {
    try {
      const res = await fetch(`/api/tests/${test.id}/start`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to start test')
      const data = await res.json()
      setAttemptId(data.attemptId)
      setStarted(true)
      timer.start()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start')
    }
  }

  const handleSubmit = async (isAutoSubmit = false) => {
    if (!attemptId) return
    setSubmitting(true)
    setShowSubmitModal(false)
    timer.pause()

    try {
      const res = await fetch(`/api/tests/${test.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId, answers }),
      })

      if (!res.ok) throw new Error('Failed to submit')
      router.push(`/student/tests/${test.id}/result?attemptId=${attemptId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submit failed')
      setSubmitting(false)
    }
  }

  if (!started) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="bg-white border border-neutral-200 rounded-xl p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 bg-neutral-100 rounded-xl flex items-center justify-center mx-auto mb-5">
            <GraduationCap size={28} className="text-neutral-700" />
          </div>
          <h1 className="text-xl font-bold text-neutral-900 mb-2">{test.title}</h1>
          <div className="flex items-center justify-center gap-4 text-sm text-neutral-500 mb-6">
            <span>{test.time_limit_minutes} minutes</span>
            <span>·</span>
            <span>{totalQuestions} questions</span>
            <span>·</span>
            <span className="capitalize">{test.type}</span>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-left">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-amber-800">
                <p className="font-medium mb-1">Before you start:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>You have {test.time_limit_minutes} minutes total</li>
                  {test.type === 'listening' && <li>Audio can only be played once</li>}
                  <li>Answer all questions before the timer runs out</li>
                  <li>Do not refresh or leave the page</li>
                </ul>
              </div>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 mb-4">{error}</p>
          )}

          <Button onClick={startTest} className="w-full h-11">
            Start Test
          </Button>
        </div>
      </div>
    )
  }

  const isListening = test.type === 'listening'
  const isReading = test.type === 'reading'

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-neutral-200 flex-shrink-0">
        <div className="flex items-center gap-2">
          <GraduationCap size={20} className="text-neutral-700" />
          <span className="text-sm text-neutral-500">
            {currentSection?.title || `Section ${currentSectionIndex + 1} of ${test.sections.length}`}
          </span>
        </div>
        <TimerDisplay
          secondsLeft={timer.secondsLeft}
          isWarning={timer.isWarning}
          isDanger={timer.isDanger}
        />
        <Button
          variant="danger"
          size="sm"
          onClick={() => setShowSubmitModal(true)}
          disabled={isSubmitting}
          loading={isSubmitting}
        >
          Submit Test
        </Button>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-hidden flex">
        {isListening && currentSection && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Audio Player */}
            {currentSection.audio_url && (
              <div className="px-6 pt-4 flex-shrink-0">
                <AudioPlayer src={currentSection.audio_url} allowReplay={false} />
              </div>
            )}
            {currentSection.instructions && (
              <div className="px-6 pt-3 flex-shrink-0">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                  {currentSection.instructions}
                </div>
              </div>
            )}

            {/* Questions */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-6 py-4 space-y-4">
                {currentSection.questions.map((question) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    value={answers[question.id] || ''}
                    onChange={(val) => setAnswer(question.id, val)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {isReading && currentSection && (
          <div className="flex-1 flex overflow-hidden">
            {/* Passage Panel */}
            <div className="w-1/2 border-r border-neutral-200 p-6 overflow-hidden flex flex-col">
              <PassageViewer
                title={currentSection.title || undefined}
                passageHtml={currentSection.passage_html || '<p>No passage content.</p>'}
                instructions={currentSection.instructions || undefined}
              />
            </div>

            {/* Questions Panel */}
            <div className="w-1/2 overflow-y-auto p-6 space-y-4">
              {currentSection.questions.map((question) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  value={answers[question.id] || ''}
                  onChange={(val) => setAnswer(question.id, val)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Answer Sheet Sidebar */}
        <div className="w-56 border-l border-neutral-200 p-4 overflow-y-auto flex-shrink-0">
          <AnswerSheet
            sections={test.sections}
            answers={answers}
            currentSectionIndex={currentSectionIndex}
            onSelectSection={goToSection}
          />
          <div className="mt-4 pt-4 border-t border-neutral-100 text-xs text-neutral-500 text-center">
            {answeredCount} / {totalQuestions} answered
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <footer className="px-6 py-3 border-t border-neutral-200 flex items-center justify-between flex-shrink-0">
        <Button
          variant="secondary"
          size="sm"
          onClick={prevSection}
          disabled={currentSectionIndex === 0}
        >
          <ChevronLeft size={16} className="mr-1" />
          Previous
        </Button>
        <span className="text-xs text-neutral-500">
          Section {currentSectionIndex + 1} of {test.sections.length}
        </span>
        <Button
          variant="secondary"
          size="sm"
          onClick={nextSection}
          disabled={currentSectionIndex === test.sections.length - 1}
        >
          Next
          <ChevronRight size={16} className="ml-1" />
        </Button>
      </footer>

      {/* Submit Confirmation Modal */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title="Submit Test"
      >
        <p className="text-sm text-neutral-600 mb-4">
          You have answered {answeredCount} out of {totalQuestions} questions.
          {answeredCount < totalQuestions && (
            <span className="text-amber-700 font-medium">
              {' '}{totalQuestions - answeredCount} questions are unanswered.
            </span>
          )}
        </p>
        <p className="text-sm text-neutral-600 mb-6">
          Once submitted, you cannot change your answers. Are you ready?
        </p>
        <div className="flex gap-3">
          <Button variant="danger" onClick={() => handleSubmit()} className="flex-1">
            Submit Test
          </Button>
          <Button variant="secondary" onClick={() => setShowSubmitModal(false)}>
            Keep Working
          </Button>
        </div>
      </Modal>
    </div>
  )
}
