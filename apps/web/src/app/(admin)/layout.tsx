import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { Shield, LayoutDashboard, Users, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const AdminLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth()

  if (!session?.user?.id) redirect('/login')
  if (session.user.role !== 'SUPERADMIN') redirect('/dashboard')

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden md:flex w-56 bg-surface border-r border-border flex-col">
        <div className="px-4 py-5 border-b border-border flex items-center gap-2">
          <Shield className="size-5 text-primary" />
          <span className="font-heading font-bold text-lg text-foreground">Admin</span>
        </div>
        <nav className="flex-1 px-2 py-4 flex flex-col gap-1">
          <Link
            href="/admin"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted hover:text-foreground hover:bg-surface-alt transition-colors"
          >
            Overview
          </Link>
          <Link
            href="/admin/users"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted hover:text-foreground hover:bg-surface-alt transition-colors"
          >
            Usuarios
          </Link>
        </nav>
        <div className="px-4 py-4 border-t border-border">
          <Link
            href="/dashboard"
            className="text-xs text-muted hover:text-foreground transition-colors"
          >
            ← Volver al dashboard
          </Link>
        </div>
      </aside>

      <main className="flex-1 p-6 pb-24 md:pb-6 overflow-auto">
        {children}
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-50 bg-surface border-t border-border flex md:hidden">
        <Link
          href="/admin"
          className="flex-1 flex flex-col items-center justify-center gap-1 py-3 text-xs text-muted transition-colors hover:text-foreground"
        >
          <Shield className="size-5" />
          <span>Overview</span>
        </Link>
        <Link
          href="/admin/users"
          className="flex-1 flex flex-col items-center justify-center gap-1 py-3 text-xs text-muted transition-colors hover:text-foreground"
        >
          <Users className="size-5" />
          <span>Usuarios</span>
        </Link>
        <Link
          href="/dashboard"
          className="flex-1 flex flex-col items-center justify-center gap-1 py-3 text-xs text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-5" />
          <span>Dashboard</span>
        </Link>
      </nav>
    </div>
  )
}

export default AdminLayout
