import clsx from 'clsx'

interface BadgeProps {
  label: string
  color?: string   // full Tailwind class string e.g. "bg-green/20 text-green"
  size?: 'sm' | 'md'
}

export default function Badge({ label, color = 'bg-muted/20 text-muted', size = 'sm' }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        color
      )}
    >
      {label}
    </span>
  )
}
