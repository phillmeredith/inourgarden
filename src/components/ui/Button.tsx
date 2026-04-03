// Button — design system button with variant/size support
// Variants: primary (--blue), accent (--pink), outline (border only), secondary (--elev bg)
// Sizes: sm, md, lg
// Proper hover/active states per DS

import type { ComponentType } from 'react'
import { cn } from '../../lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'outline' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  icon?: ComponentType<{ size: number; className?: string }>
  children: React.ReactNode
}

const variantStyles: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: cn(
    'bg-[var(--blue)] text-white',
    'hover:brightness-110 active:brightness-90',
    'border border-transparent',
  ),
  accent: cn(
    'bg-[var(--pink)] text-white',
    'hover:brightness-110 active:brightness-90',
    'border border-transparent',
  ),
  outline: cn(
    'bg-transparent text-[var(--t1)]',
    'border border-[var(--border)]',
    'hover:bg-[var(--elev)] active:bg-[var(--border-s)]',
  ),
  secondary: cn(
    'bg-[var(--elev)] text-[var(--t1)]',
    'border border-[var(--border-s)]',
    'hover:bg-[var(--border-s)] active:bg-[var(--border)]',
  ),
}

const sizeStyles: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-base gap-2.5 rounded-xl',
}

const iconSizes: Record<NonNullable<ButtonProps['size']>, number> = {
  sm: 14,
  md: 16,
  lg: 18,
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-semibold',
        'transition-all duration-150',
        'disabled:opacity-40 disabled:pointer-events-none',
        'motion-safe:active:scale-[.97]',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      disabled={disabled}
      {...props}
    >
      {Icon && <Icon size={iconSizes[size]} className="shrink-0" />}
      {children}
    </button>
  )
}
