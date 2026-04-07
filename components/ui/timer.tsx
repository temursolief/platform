'use client'

import { Clock } from 'lucide-react'
import { formatTime } from '@/lib/utils/time'

interface TimerDisplayProps {
  secondsLeft: number
  isWarning?: boolean
  isDanger?: boolean
  className?: string
}

export function TimerDisplay({ secondsLeft, isWarning, isDanger, className = '' }: TimerDisplayProps) {
  const colorClass = isDanger
    ? 'text-red-600'
    : isWarning
    ? 'text-amber-600'
    : 'text-neutral-700'

  return (
    <div className={`flex items-center gap-1.5 font-mono text-sm font-semibold ${colorClass} ${className}`}>
      <Clock size={16} className={isDanger ? 'animate-pulse' : ''} />
      <span>{formatTime(secondsLeft)}</span>
    </div>
  )
}
