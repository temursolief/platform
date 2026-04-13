'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { GraduationCap, AlertTriangle, EyeOff, Maximize2 } from 'lucide-react'
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
  const [showFocusWarning, setShowFocusWarning] = useState(false)
  const [tabSwitchCount, setTabSwitchCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

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

  // ── Focus / fullscreen lock ────────────────────────────────────────────────
  useEffect(() => {
    if (!started) return

    // Enter fullscreen immediately
    document.documentElement.requestFullscreen?.().catch(() => {})

    // Re-enter fullscreen whenever it's exited (Esc or other means)
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        // Small delay so browser's own exit animation completes
        setTimeout(() => {
          document.documentElement.requestFullscreen?.().catch(() => {})
        }, 80)
      }
    }

    // Prevent Escape from being processed by the browser in fullscreen
    // (capture phase runs before browser's fullscreen handler in supported browsers)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopImmediatePropagation()
      }
    }

    // Warn on tab/window switch
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount((c) => c + 1)
        setShowFocusWarning(true)
      }
    }

    // Warn before accidental navigation away
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('keydown', handleKeyDown, true) // capture phase
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('keydown', handleKeyDown, true)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.exitFullscreen?.().catch(() => {})
    }
  }, [started])

  const requestFullscreen = () => {
    document.documentElement.requestFullscreen?.().catch(() => {})
  }

  // ── Start / Submit ─────────────────────────────────────────────────────────
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

  // ── Pre-test screen ────────────────────────────────────────────────────────
  if (!started) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="bg-white border border-neutral-200 rounded-xl p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 bg-neutral-100 rounded-xl flex items-center justify-center mx-auto mb-5">
            <GraduationCap size={28} className="text-neutral-700" />
          </div>
          <h1 className="text-xl font-bold text-neutral-900 mb-2">{test.title}</h1>
          <div className="flex items-center justify-center gap-4 text-sm text-neutral-500 mb-6">
            <span>{test.time_limit_minutes} min</span>
            <span>·</span>
            <span>{totalQuestions} questions</span>
            <span>·</span>
            <span>{test.sections.length} section{test.sections.length !== 1 ? 's' : ''}</span>
            <span>·</span>
            <span className="capitalize">{test.type}</span>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-left">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-amber-800 space-y-1">
                <p className="font-medium">Before you start:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>You have {test.time_limit_minutes} minutes total</li>
                  {test.type === 'listening' && <li>Audio can only be played once</li>}
                  <li>Answer all questions before the timer runs out</li>
                  <li>The page will enter fullscreen — do not leave the tab</li>
                  <li>Switching tabs or windows is recorded</li>
                </ul>
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

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
    <div ref={containerRef} className="h-screen flex flex-col bg-white overflow-hidden">

      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-neutral-200 flex-shrink-0 bg-white z-10">
        <div className="flex items-center gap-2">
          <GraduationCap size={20} className="text-neutral-700" />
          <span className="text-sm font-medium text-neutral-700 hidden sm:block">{test.title}</span>
        </div>
        <TimerDisplay
          secondsLeft={timer.secondsLeft}
          isWarning={timer.isWarning}
          isDanger={timer.isDanger}
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={requestFullscreen}
            title="Enter fullscreen"
            className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <Maximize2 size={15} />
          </button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowSubmitModal(true)}
            disabled={isSubmitting}
            loading={isSubmitting}
          >
            Submit Test
          </Button>
        </div>
      </header>

      {/* ── Section Tab Bar ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-neutral-100 bg-neutral-50 overflow-x-auto flex-shrink-0">
        {test.sections.map((section, idx) => {
          const sectionAnswered = section.questions.filter((q) => answers[q.id]?.trim()).length
          const sectionTotal = section.questions.length
          const isActive = idx === currentSectionIndex
          const isComplete = sectionAnswered === sectionTotal && sectionTotal > 0

          return (
            <button
              key={section.id}
              type="button"
              onClick={() => goToSection(idx)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-neutral-900 text-white'
                  : isComplete
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                  : 'bg-white border border-neutral-200 text-neutral-600 hover:border-neutral-400 hover:bg-neutral-50'
              }`}
            >
              {section.title || `Section ${idx + 1}`}
              <span
                className={`text-[10px] rounded-full px-1.5 py-0.5 font-normal ${
                  isActive
                    ? 'bg-neutral-700 text-neutral-300'
                    : isComplete
                    ? 'bg-emerald-200 text-emerald-800'
                    : 'bg-neutral-100 text-neutral-500'
                }`}
              >
                {sectionAnswered}/{sectionTotal}
              </span>
            </button>
          )
        })}

        {/* Overall answered count */}
        <span className="ml-auto flex-shrink-0 text-xs text-neutral-400 pr-1">
          {answeredCount}/{totalQuestions} answered
        </span>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden flex">

        {/* Listening layout */}
        {isListening && currentSection && (
          <div className="flex-1 flex flex-col overflow-hidden">
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
            <div className="flex-1 overflow-y-auto">
              <div className="px-6 py-4 space-y-4">
                {currentSection.questions.map((question) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    value={answers[question.id] || ''}
                    onChange={(val) => setAnswer(question.id, val)}
                    matchOptions={question.options?.map((o) => o.option_text) ?? []}
                    allAnswers={answers}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Reading layout — split passage | questions */}
        {isReading && currentSection && (
          <div className="flex-1 flex overflow-hidden">
            <div className="w-1/2 border-r border-neutral-200 overflow-hidden flex flex-col">
              <PassageViewer
                title={currentSection.title || undefined}
                passageHtml={currentSection.passage_html || '<p>No passage content.</p>'}
                instructions={currentSection.instructions || undefined}
              />
            </div>
            <div className="w-1/2 overflow-y-auto p-6 space-y-4">
              {currentSection.questions.map((question) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  value={answers[question.id] || ''}
                  onChange={(val) => setAnswer(question.id, val)}
                  matchOptions={question.options?.map((o) => o.option_text) ?? []}
                />
              ))}
            </div>
          </div>
        )}

        {/* Answer Sheet Sidebar */}
        <div className="w-52 border-l border-neutral-200 p-4 overflow-y-auto flex-shrink-0 bg-neutral-50/50">
          <AnswerSheet
            sections={test.sections}
            answers={answers}
            currentSectionIndex={currentSectionIndex}
            onSelectSection={goToSection}
          />
        </div>
      </div>

      {/* ── Section Footer Navigation ────────────────────────────────────────── */}
      <footer className="px-6 py-3 border-t border-neutral-100 flex items-center justify-between flex-shrink-0 bg-white">
        <Button
          variant="secondary"
          size="sm"
          onClick={prevSection}
          disabled={currentSectionIndex === 0}
        >
          ← Previous Section
        </Button>

        <span className="text-xs text-neutral-400">
          {currentSection?.title || `Section ${currentSectionIndex + 1}`}
          {' '}— {currentSection?.questions.filter((q) => answers[q.id]?.trim()).length ?? 0}/
          {currentSection?.questions.length ?? 0} answered
        </span>

        {currentSectionIndex < test.sections.length - 1 ? (
          <Button variant="secondary" size="sm" onClick={nextSection}>
            Next Section →
          </Button>
        ) : (
          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowSubmitModal(true)}
            disabled={isSubmitting}
          >
            Review &amp; Submit
          </Button>
        )}
      </footer>

      {/* ── Submit Confirmation Modal ────────────────────────────────────────── */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title="Submit Test"
      >
        <p className="text-sm text-neutral-600 mb-4">
          You have answered <span className="font-semibold">{answeredCount}</span> out of{' '}
          <span className="font-semibold">{totalQuestions}</span> questions.
          {answeredCount < totalQuestions && (
            <span className="text-amber-700 font-medium">
              {' '}{totalQuestions - answeredCount} question{totalQuestions - answeredCount !== 1 ? 's are' : ' is'} unanswered.
            </span>
          )}
        </p>

        {/* Section summary */}
        <div className="mb-4 space-y-1">
          {test.sections.map((section, idx) => {
            const done = section.questions.filter((q) => answers[q.id]?.trim()).length
            const total = section.questions.length
            return (
              <div key={section.id} className="flex items-center justify-between text-xs">
                <span className="text-neutral-600">{section.title || `Section ${idx + 1}`}</span>
                <span className={done === total ? 'text-emerald-600 font-medium' : 'text-amber-600'}>
                  {done}/{total}
                </span>
              </div>
            )
          })}
        </div>

        <p className="text-sm text-neutral-500 mb-6">
          Once submitted you cannot change your answers.
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

      {/* ── Tab-switch / Focus Warning Modal ────────────────────────────────── */}
      <Modal
        isOpen={showFocusWarning}
        onClose={() => setShowFocusWarning(false)}
        title="You Left the Test"
      >
        <div className="flex items-start gap-3 mb-4">
          <EyeOff size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-neutral-700 font-medium mb-1">
              Tab switching detected ({tabSwitchCount} time{tabSwitchCount !== 1 ? 's' : ''})
            </p>
            <p className="text-sm text-neutral-500">
              Leaving the test window is recorded. In the real IELTS exam this is not permitted.
              Please stay on this page for the remainder of the test.
            </p>
          </div>
        </div>
        <Button onClick={() => { setShowFocusWarning(false); requestFullscreen() }} className="w-full">
          Return to Test
        </Button>
      </Modal>

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg shadow-lg">
          {error}
          <button onClick={() => setError(null)} className="ml-3 text-red-400 hover:text-red-600">✕</button>
        </div>
      )}
    </div>
  )
}
