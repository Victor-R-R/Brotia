import { redirect } from 'next/navigation'
import { LayoutDashboard, Leaf, Bot, Settings } from 'lucide-react'
import { auth } from '@/lib/auth'
import { NavLink } from '@/components/nav/nav-link'

const navItems = [
  { href: '/',        icon: LayoutDashboard, label: 'Invernaderos' },
  { href: '/cultivos', icon: Leaf,           label: 'Cultivos'     },
  { href: '/chat',    icon: Bot,             label: 'Brotia IA'    },
  { href: '/ajustes', icon: Settings,        label: 'Ajustes'      },
]

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="flex min-h-screen">
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

      <main className="flex-1 p-6 overflow-auto bg-background">
        {children}
      </main>
    </div>
  )
}

export default DashboardLayout
