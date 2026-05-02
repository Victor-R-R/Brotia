'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Shield } from 'lucide-react'

const baseNavItems = [
  { href: '/dashboard',    icon: '🏡', label: 'Inicio'       },
  { href: '/cultivos',     icon: '🌱', label: 'Cultivos'     },
  { href: '/estadisticas', icon: '📊', label: 'Stats'        },
  { href: '/community',    icon: '🤝', label: 'Comunidad'    },
  { href: '/chat',         icon: '🤖', label: 'IA'           },
  { href: '/compte',       icon: '👤', label: 'Cuenta'       },
]

type BottomNavProps = {
  isAdmin?: boolean
}

export const BottomNav = ({ isAdmin }: BottomNavProps) => {
  const pathname = usePathname()
  const navItems = isAdmin
    ? [...baseNavItems, { href: '/admin', icon: '🛡️', label: 'Admin' }]
    : baseNavItems

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-surface-alt border-t border-border flex md:hidden">
      {navItems.map(({ href, icon, label }) => {
        const isActive = pathname === href
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? 'page' : undefined}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 text-xs transition-colors ${
              isActive ? 'text-primary font-semibold' : 'text-muted hover:text-primary'
            }`}
          >
            <span className="text-lg leading-none">{icon}</span>
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
