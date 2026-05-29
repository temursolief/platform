import { cva, type VariantProps } from 'class-variance-authority'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full text-xs font-semibold px-2.5 py-0.5',
  {
    variants: {
      variant: {
        default:   'bg-[var(--surface-2)] text-[var(--ink-soft)]',
        success:   'bg-[var(--accent-soft)] text-[var(--accent-ink)]',
        warning:   'bg-[var(--gold-soft)] text-[var(--gold-ink)]',
        danger:    'bg-[var(--rose-soft)] text-[var(--rose)]',
        info:      'bg-[var(--sky-soft)] text-[var(--sky)]',
        primary:   'bg-[var(--primary-soft)] text-[var(--primary-ink)]',
        listening: 'bg-[var(--plum-soft)] text-[var(--plum)]',
        reading:   'bg-[var(--sky-soft)] text-[var(--sky)]',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

interface BadgeProps extends VariantProps<typeof badgeVariants> {
  children: React.ReactNode
  className?: string
}

export function Badge({ variant, children, className = '' }: BadgeProps) {
  return <span className={badgeVariants({ variant, className })}>{children}</span>
}
