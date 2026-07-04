import * as React from 'react'
import { clsx } from 'clsx'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean
}

export function Card({ className, interactive = false, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-2xl border border-gray-100 bg-white shadow-sm',
        interactive && 'transition-all hover:-translate-y-1 hover:border-arkara-amber/40 hover:shadow-xl hover:shadow-gray-200/30',
        className
      )}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx('border-b border-gray-100 px-6 py-5', className)} {...props} />
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx('p-6', className)} {...props} />
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={clsx('text-base font-bold text-gray-900', className)} {...props} />
}
