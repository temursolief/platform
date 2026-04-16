import { useRef, useEffect, useCallback } from 'react'

/**
 * Tracks time spent per question using performance.now() deltas.
 * All state is in refs — zero re-renders, zero DB calls during the test.
 * Data is flushed once at submission via getTimings().
 */
export function useQuestionTimer() {
  // Accumulated ms per question (updated when a timer stops)
  const totals = useRef<Record<string, number>>({})
  // Currently running timers: qId → performance.now() start timestamp
  const activeStart = useRef<Record<string, number>>({})
  // Which qIds were running just before a tab-hide (so we can resume them)
  const wasActive = useRef<Set<string>>(new Set())

  const startQuestion = useCallback((qId: string) => {
    if (qId in activeStart.current) return // already running — no-op
    activeStart.current[qId] = performance.now()
    wasActive.current.add(qId)
  }, [])

  const pauseQuestion = useCallback((qId: string) => {
    const start = activeStart.current[qId]
    if (start === undefined) return
    totals.current[qId] = (totals.current[qId] ?? 0) + (performance.now() - start)
    delete activeStart.current[qId]
  }, [])

  const pauseAll = useCallback(() => {
    for (const qId of Object.keys(activeStart.current)) {
      const start = activeStart.current[qId]
      totals.current[qId] = (totals.current[qId] ?? 0) + (performance.now() - start)
      delete activeStart.current[qId]
    }
  }, [])

  // Call when navigating to a new section: stops all timers and clears the
  // resume set so tab-return doesn't restart stale questions.
  const clearSection = useCallback(() => {
    pauseAll()
    wasActive.current.clear()
  }, [pauseAll])

  // Handles tab-hide (pause) and tab-return (resume active set)
  useEffect(() => {
    const handler = () => {
      if (document.hidden) {
        pauseAll()
        // wasActive is preserved so we can restart on return
      } else {
        const now = performance.now()
        for (const qId of wasActive.current) {
          if (!(qId in activeStart.current)) {
            activeStart.current[qId] = now
          }
        }
      }
    }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [pauseAll])

  /**
   * Returns a snapshot of all accumulated time (ms) per question,
   * including any currently running timers. Does NOT stop timers —
   * call this right before submission.
   */
  const getTimings = useCallback((): Record<string, number> => {
    const snapshot: Record<string, number> = { ...totals.current }
    const now = performance.now()
    for (const [qId, start] of Object.entries(activeStart.current)) {
      snapshot[qId] = (snapshot[qId] ?? 0) + (now - start)
    }
    return snapshot
  }, [])

  return { startQuestion, pauseQuestion, clearSection, getTimings }
}
