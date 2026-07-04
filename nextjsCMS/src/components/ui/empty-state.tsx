import * as React from 'react'
import { clsx } from 'clsx'

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action, className, ...props }: EmptyStateProps) {
  return (
    <div className={clsx('flex flex-col items-center justify-center px-6 py-14 text-center', className)} {...props}>
      {icon ? (
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-arkara-cream text-arkara-amber">
          {icon}
        </div>
      ) : null}
      <h3 className="text-base font-black uppercase tracking-tight text-arkara-green">{title}</h3>
      {description ? <p className="mt-2 max-w-sm text-sm leading-relaxed text-gray-500">{description}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}
