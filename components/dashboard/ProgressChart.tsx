'use client'

interface DataPoint {
  date: string
  bandScore: number
  type: 'listening' | 'reading'
}

interface ProgressChartProps {
  data: DataPoint[]
  height?: number
}

export function ProgressChart({ data, height = 120 }: ProgressChartProps) {
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-sm rounded-xl"
        style={{ height, background: 'var(--surface-2)', color: 'var(--ink-muted)', border: '1px solid var(--line)' }}
      >
        No data yet
      </div>
    )
  }

  const maxScore = 9
  const minScore = 0
  const range = maxScore - minScore

  const paddingX = 40
  const paddingY = 16
  const chartWidth = 500
  const chartHeight = height

  const points = data.map((d, i) => ({
    x: paddingX + (i / Math.max(data.length - 1, 1)) * (chartWidth - paddingX * 2),
    y: chartHeight - paddingY - ((d.bandScore - minScore) / range) * (chartHeight - paddingY * 2),
    ...d,
  }))

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ')

  const refLines = [5, 6, 7, 8]

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="w-full"
        style={{ height }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Grid lines */}
        {refLines.map((score) => {
          const y = chartHeight - paddingY - ((score - minScore) / range) * (chartHeight - paddingY * 2)
          return (
            <g key={score}>
              <line
                x1={paddingX}
                y1={y}
                x2={chartWidth - paddingX}
                y2={y}
                stroke="var(--line)"
                strokeWidth="1"
                strokeDasharray="3 4"
              />
              <text x={paddingX - 6} y={y + 4} textAnchor="end" fill="var(--ink-muted)" fontSize="10" fontWeight="600">
                {score}
              </text>
            </g>
          )
        })}

        {/* Line */}
        {data.length > 1 && (
          <path
            d={pathD}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Points colored by type */}
        {points.map((p, i) => {
          const color = p.type === 'listening' ? 'var(--plum)' : 'var(--sky)'
          return (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={5} fill={color} stroke="var(--surface)" strokeWidth="2" />
              <title>{`${p.date}: Band ${p.bandScore} (${p.type})`}</title>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
