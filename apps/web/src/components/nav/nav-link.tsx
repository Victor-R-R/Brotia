'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'

type NavLinkProps = {
  href:  string
  icon:  LucideIcon
  label: string
}

export const NavLink = ({ href, icon: Icon, label }: NavLinkProps) => {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
        isActive
          ? 'bg-surface-alt text-foreground font-medium'
          : 'text-muted hover:text-foreground hover:bg-surface-alt'
      }`}
    >
      <Icon className="size-4" />
      {label}
    </Link>
  )
}
