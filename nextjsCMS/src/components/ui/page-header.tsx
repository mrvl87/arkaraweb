import * as React from 'react'
import { clsx } from 'clsx'

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  accent?: string
  description?: string
  eyebrow?: string
  action?: React.ReactNode
}

export function PageHeader({
  title,
  accent,
  description,
  eyebrow,
  action,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <div
      className={clsx(
        'flex flex-col gap-4 border-b border-arkara-green/5 pb-6 md:flex-row md:items-end md:justify-between',
        className
      )}
      {...props}
    >
      <div>
        {eyebrow ? (
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-400">{eyebrow}</p>
        ) : null}
        <h1 className="text-3xl font-extrabold tracking-tight text-arkara-green md:text-4xl">
          {title}
          {accent ? <span className="text-arkara-amber"> {accent}</span> : null}
        </h1>
        {description ? <p className="mt-2 text-sm font-medium text-gray-500">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}
