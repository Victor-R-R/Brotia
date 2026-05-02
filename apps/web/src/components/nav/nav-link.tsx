'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'

type NavLinkProps = {
  href:  string
  icon:  LucideIcon | string
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
          ? 'bg-primary/10 text-primary font-semibold'
          : 'text-muted hover:text-primary hover:bg-primary/10'
      }`}
    >
      {typeof Icon === 'string' ? (
        <span className="text-base leading-none">{Icon}</span>
      ) : (
        <Icon className={`size-4 flex-shrink-0 ${isActive ? 'text-primary' : 'text-subtle'}`} />
      )}
      {label}
    </Link>
  )
}
