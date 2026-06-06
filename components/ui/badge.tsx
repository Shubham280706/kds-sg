import React from 'react'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger'
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className = '', variant = 'default', ...props }, ref) => {
    const variantStyles = {
      default: 'bg-gray-100 text-gray-800',
      success: 'bg-green-100 text-green-800',
      warning: 'bg-amber-100 text-amber-800',
      danger: 'bg-red-100 text-red-800',
    }

    return (
      <span
        ref={ref}
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantStyles[variant]} ${className}`}
        {...props}
      />
    )
  }
)

Badge.displayName = 'Badge'
