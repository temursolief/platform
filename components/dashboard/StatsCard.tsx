import { Card } from '@/components/ui/card'

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  trend?: {
    direction: 'up' | 'down' | 'neutral'
    label: string
  }
  highlight?: boolean
}

export function StatsCard({ title, value, subtitle, icon, trend, highlight }: StatsCardProps) {
  return (
    <Card className={highlight ? 'border-neutral-900 bg-neutral-900 text-white' : ''}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-sm font-medium ${highlight ? 'text-neutral-300' : 'text-neutral-500'}`}>
            {title}
          </p>
          <p className={`text-3xl font-bold mt-1 ${highlight ? 'text-white' : 'text-neutral-900'}`}>
            {value}
          </p>
          {subtitle && (
            <p className={`text-xs mt-1 ${highlight ? 'text-neutral-400' : 'text-neutral-400'}`}>
              {subtitle}
            </p>
          )}
          {trend && (
            <p className={`text-xs mt-2 flex items-center gap-1 ${
              trend.direction === 'up' ? 'text-emerald-600' :
              trend.direction === 'down' ? 'text-red-600' :
              'text-neutral-500'
            }`}>
              {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'}
              {trend.label}
            </p>
          )}
        </div>
        {icon && (
          <div className={`p-2 rounded-lg ${highlight ? 'bg-white/10' : 'bg-neutral-100'}`}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
}
