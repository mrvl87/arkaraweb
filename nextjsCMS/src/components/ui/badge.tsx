import * as React from 'react'
import { clsx } from 'clsx'

type BadgeVariant = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variantClasses: Record<BadgeVariant, string> = {
  neutral: 'border-gray-200 bg-gray-50 text-gray-600',
  brand: 'border-arkara-amber/30 bg-arkara-amber/10 text-arkara-green',
  success: 'border-green-200 bg-green-50 text-green-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  danger: 'border-red-200 bg-red-50 text-red-700',
  info: 'border-sky-200 bg-sky-50 text-sky-700',
}

export function Badge({ className, variant = 'neutral', ...props }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold',
        variantClasses[variant],
        className
      )}
      {...props}
    />
  )
}
