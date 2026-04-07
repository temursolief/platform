'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface UseTimerOptions {
  initialSeconds: number
  onExpire?: () => void
  autoStart?: boolean
}

export function useTimer({ initialSeconds, onExpire, autoStart = false }: UseTimerOptions) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds)
  const [isRunning, setIsRunning] = useState(autoStart)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const onExpireRef = useRef(onExpire)

  useEffect(() => {
    onExpireRef.current = onExpire
  }, [onExpire])

  useEffect(() => {
    if (isRunning && secondsLeft > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!)
            setIsRunning(false)
            onExpireRef.current?.()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning, secondsLeft])

  const start = useCallback(() => setIsRunning(true), [])
  const pause = useCallback(() => setIsRunning(false), [])
  const reset = useCallback((newSeconds?: number) => {
    setIsRunning(false)
    setSecondsLeft(newSeconds ?? initialSeconds)
  }, [initialSeconds])

  const isWarning = secondsLeft <= 300 && secondsLeft > 0   // < 5 minutes
  const isDanger = secondsLeft <= 60 && secondsLeft > 0     // < 1 minute

  return { secondsLeft, isRunning, isWarning, isDanger, start, pause, reset }
}
