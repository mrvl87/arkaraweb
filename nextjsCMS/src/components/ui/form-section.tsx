import * as React from 'react'
import { clsx } from 'clsx'
import { Card } from './card'

interface FormSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  action?: React.ReactNode
}

export function FormSection({ title, description, action, className, children, ...props }: FormSectionProps) {
  return (
    <Card className={clsx('overflow-hidden', className)} {...props}>
      <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
        <div>
          <h2 className="text-base font-bold text-gray-900">{title}</h2>
          {description ? <p className="mt-1 text-sm text-gray-500">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="space-y-5 p-6">{children}</div>
    </Card>
  )
}
