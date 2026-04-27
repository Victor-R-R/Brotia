'use client'

import { LayoutDashboard, Leaf, BarChart2, Bot, Settings } from 'lucide-react'
import { NavLink } from './nav-link'

const navItems = [
  { href: '/dashboard',     icon: LayoutDashboard, label: 'Invernaderos'  },
  { href: '/cultivos',      icon: Leaf,            label: 'Cultivos'      },
  { href: '/estadisticas',  icon: BarChart2,        label: 'Estadísticas'  },
  { href: '/chat',          icon: Bot,             label: 'Brotia IA'     },
  { href: '/compte',         icon: Settings,        label: 'Mi cuenta'     },
]

export const Sidebar = () => (
  <aside className="hidden md:flex w-60 bg-surface border-r border-border flex-col">
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
