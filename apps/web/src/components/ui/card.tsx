import type { HTMLAttributes } from 'react'

type CardProps = HTMLAttributes<HTMLDivElement>

export const Card = ({ children, className = '', ...props }: CardProps) => (
  <div
    {...props}
    className={`bg-surface border border-border rounded-lg shadow-sm p-4 ${className}`}
  >
    {children}
  </div>
)
