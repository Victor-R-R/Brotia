'use client'

import { LayoutDashboard, Leaf, Bot, Settings } from 'lucide-react'
import { NavLink } from './nav-link'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Invernaderos' },
  { href: '/cultivos',  icon: Leaf,            label: 'Cultivos'     },
  { href: '/chat',      icon: Bot,             label: 'Brotia IA'    },
  { href: '/ajustes',   icon: Settings,        label: 'Ajustes'      },
]

export const Sidebar = () => (
  <aside className="w-60 bg-surface border-r border-border flex flex-col">
    <div className="px-4 py-5 border-b border-border">
      <span className="font-heading font-bold text-xl text-primary">Brotia</span>
    </div>
    <nav className="flex-1 px-2 py-4 flex flex-col gap-1">
      {navItems.map(({ href, icon, label }) => (
        <NavLink key={href} href={href} icon={icon} label={label} />
      ))}
    </nav>
  </aside>
)
