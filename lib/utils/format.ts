export function formatBandScore(score: number | null): string {
  if (score === null || score === undefined) return '—'
  return score.toFixed(1)
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDifficulty(difficulty: string): string {
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1)
}

export function formatTestType(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1)
}

export function formatScore(raw: number | null, total: number | null): string {
  if (raw === null || total === null) return '—'
  return `${raw}/${total}`
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
