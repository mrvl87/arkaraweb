import * as React from 'react'
import { clsx } from 'clsx'

type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-arkara-green text-white shadow-sm shadow-arkara-green/10 hover:bg-arkara-dark',
  accent: 'bg-arkara-amber text-arkara-green shadow-sm shadow-arkara-amber/20 hover:bg-arkara-green hover:text-white',
  secondary: 'border border-gray-200 bg-white text-arkara-green hover:border-arkara-amber/50 hover:bg-arkara-cream',
  ghost: 'bg-transparent text-arkara-green hover:bg-arkara-green/5',
  danger: 'bg-red-600 text-white shadow-sm shadow-red-600/10 hover:bg-red-700',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-xs',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-7 text-sm',
  icon: 'h-10 w-10 p-0',
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', type = 'button', ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={clsx(
          'inline-flex shrink-0 items-center justify-center gap-2 rounded-xl font-bold transition-all active:scale-95 disabled:pointer-events-none disabled:opacity-55',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'
