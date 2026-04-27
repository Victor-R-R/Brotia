'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Leaf, Users, Bot, User, BarChart3, Shield } from 'lucide-react'

const baseNavItems = [
  { href: '/dashboard',     icon: LayoutDashboard, label: 'Inicio'        },
  { href: '/cultivos',      icon: Leaf,            label: 'Cultivos'      },
  { href: '/estadisticas',  icon: BarChart3,       label: 'Estadísticas'  },
  { href: '/community',     icon: Users,           label: 'Comunidad'     },
  { href: '/chat',          icon: Bot,             label: 'IA'            },
  { href: '/compte',        icon: User,            label: 'Cuenta'        },
]

type BottomNavProps = {
  isAdmin?: boolean
}

export const BottomNav = ({ isAdmin }: BottomNavProps) => {
  const pathname = usePathname()
  const navItems = isAdmin
    ? [...baseNavItems, { href: '/admin', icon: Shield, label: 'Admin' }]
    : baseNavItems

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-surface border-t border-border flex md:hidden">
      {navItems.map(({ href, icon: Icon, label }) => {
        const isActive = pathname === href
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? 'page' : undefined}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 text-xs transition-colors ${
              isActive ? 'text-primary font-medium' : 'text-muted'
            }`}
          >
            <Icon className="size-5" />
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
