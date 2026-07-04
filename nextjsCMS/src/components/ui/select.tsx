import * as React from 'react'
import { clsx } from 'clsx'

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, hasError = false, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={clsx(
          'w-full rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 outline-none transition-all disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400',
          hasError
            ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100'
            : 'border-gray-200 focus:border-arkara-amber focus:ring-2 focus:ring-arkara-amber/20',
          className
        )}
        {...props}
      />
    )
  }
)

Select.displayName = 'Select'
