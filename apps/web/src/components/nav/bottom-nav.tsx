'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Leaf, Users, Bot, Settings } from 'lucide-react'

const navItems = [
  { href: '/dashboard',  icon: LayoutDashboard, label: 'Inicio'    },
  { href: '/cultivos',   icon: Leaf,            label: 'Cultivos'  },
  { href: '/community',  icon: Users,           label: 'Comunidad' },
  { href: '/chat',       icon: Bot,             label: 'IA'        },
  { href: '/compte',     icon: Settings,        label: 'Cuenta'    },
]

export const BottomNav = () => {
  const pathname = usePathname()

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
