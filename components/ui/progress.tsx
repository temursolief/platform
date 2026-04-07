interface ProgressProps {
  value: number
  max?: number
  className?: string
  showLabel?: boolean
  color?: 'default' | 'success' | 'warning' | 'danger'
}

const colorClasses = {
  default: 'bg-neutral-900',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
}

export function Progress({
  value,
  max = 100,
  className = '',
  showLabel = false,
  color = 'default',
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${colorClasses[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-neutral-500 w-12 text-right">
          {value}/{max}
        </span>
      )}
    </div>
  )
}
