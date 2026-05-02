import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { Sidebar } from '@/components/nav/sidebar'
import { BottomNav } from '@/components/nav/bottom-nav'
import { ImpersonationBanner } from '@/components/admin/impersonation-banner'

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth()
  if (!session) redirect('/login')

  const isAdmin = session.user.role === 'SUPERADMIN'

  const isImpersonating = !!session.user._impersonatedBy

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      {isImpersonating && (
        <ImpersonationBanner
          targetName={session.user.name ?? null}
          targetEmail={session.user.email ?? ''}
        />
      )}
      <div className="flex flex-1">
        <Sidebar isAdmin={isAdmin} />
        <main className="flex-1 p-4 md:p-6 pb-nav-safe md:pb-6 overflow-auto bg-background">
          {children}
        </main>
        <BottomNav isAdmin={isAdmin} />
      </div>
    </div>
  )
}

export default DashboardLayout
