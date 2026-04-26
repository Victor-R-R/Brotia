import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'ghost' | 'danger'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  loading?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-hover',
  ghost:   'border border-border text-muted hover:text-foreground hover:border-primary/50',
  danger:  'bg-danger text-danger-text hover:opacity-90',
}

export const Button = ({
  variant = 'primary',
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) => (
  <button
    {...props}
    disabled={disabled || loading}
    className={`
      inline-flex items-center justify-center gap-2
      px-4 py-2.5 rounded-md text-sm font-medium
      transition-colors duration-150 cursor-pointer
      disabled:opacity-50 disabled:cursor-not-allowed
      ${variantClasses[variant]} ${className}
    `.trim()}
  >
    {loading ? (
      <span className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
    ) : null}
    {children}
  </button>
)
