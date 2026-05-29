import { forwardRef } from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', hoverable = false, children, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`rounded-2xl p-6 ${hoverable ? 'cursor-pointer transition-all hover:-translate-y-0.5' : ''} ${className}`}
        style={{
          background: 'var(--surface)',
          border: '1.5px solid var(--line)',
          boxShadow: 'var(--shadow-sm)',
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Card.displayName = 'Card'

export function CardHeader({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`mb-4 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ className = '', children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={`text-lg font-semibold ${className}`} style={{ color: 'var(--ink)' }} {...props}>
      {children}
    </h3>
  )
}

export function CardDescription({ className = '', children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`text-sm mt-1 ${className}`} style={{ color: 'var(--ink-muted)' }} {...props}>
      {children}
    </p>
  )
}

export function CardContent({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`mt-4 pt-4 ${className}`}
      style={{ borderTop: '1px solid var(--line)' }}
      {...props}
    >
      {children}
    </div>
  )
}
