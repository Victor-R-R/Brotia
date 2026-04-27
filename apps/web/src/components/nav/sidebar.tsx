'use client'

import { LayoutDashboard, Leaf, BarChart2, Bot, User, Shield, Users } from 'lucide-react'
import { NavLink } from './nav-link'

const navItems = [
  { href: '/dashboard',    icon: LayoutDashboard, label: 'Invernaderos'  },
  { href: '/cultivos',     icon: Leaf,            label: 'Cultivos'      },
  { href: '/estadisticas', icon: BarChart2,        label: 'Estadísticas'  },
  { href: '/chat',         icon: Bot,             label: 'Brotia IA'     },
  { href: '/community',    icon: Users,           label: 'Comunidad'     },
  { href: '/compte',       icon: User,            label: 'Mi cuenta'     },
]

type SidebarProps = {
  isAdmin?: boolean
}

export const Sidebar = ({ isAdmin }: SidebarProps) => (
  <aside className="hidden md:flex w-60 bg-surface border-r border-border flex-col">
    <div className="px-4 py-5 border-b border-border">
      <span className="font-heading font-bold text-xl text-primary">Brotia</span>
    </div>
    <nav className="flex-1 px-2 py-4 flex flex-col gap-1">
      {navItems.map(({ href, icon, label }) => (
        <NavLink key={href} href={href} icon={icon} label={label} />
      ))}
    </nav>
    {isAdmin && (
      <div className="px-2 py-3 border-t border-border">
        <NavLink href="/admin" icon={Shield} label="Admin" />
      </div>
    )}
  </aside>
)
