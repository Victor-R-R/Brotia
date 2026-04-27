import { auth } from '@/lib/auth'
import { db } from '@brotia/db'
import { Users, Sprout, LayoutDashboard, Bell } from 'lucide-react'

const StatCard = ({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
}) => (
  <div className="bg-surface border border-border rounded-lg p-5 flex items-center gap-4">
    <div className="bg-primary/10 p-3 rounded-md">
      <Icon className="size-5 text-primary" />
    </div>
    <div>
      <p className="text-sm text-muted">{label}</p>
      <p className="font-heading text-2xl font-bold text-foreground">{value}</p>
    </div>
  </div>
)

const AdminPage = async () => {
  const [userCount, greenhouseCount, cropCount, alertCount, recentUsers] = await Promise.all([
    db.user.count(),
    db.greenhouse.count(),
    db.crop.count(),
    db.weatherAlert.count({ where: { read: false } }),
    db.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, email: true, role: true, createdAt: true, provider: true },
    }),
  ])

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">Panel de administración</h1>
        <p className="text-sm text-muted mt-1">Vista global de Brotia</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Usuarios" value={userCount} icon={Users} />
        <StatCard label="Invernaderos" value={greenhouseCount} icon={LayoutDashboard} />
        <StatCard label="Cultivos" value={cropCount} icon={Sprout} />
        <StatCard label="Alertas sin leer" value={alertCount} icon={Bell} />
      </div>

      <div className="bg-surface border border-border rounded-lg">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-heading text-base font-semibold text-foreground">Usuarios recientes</h2>
        </div>
        <div className="divide-y divide-border">
          {recentUsers.map(u => (
            <div key={u.id} className="px-5 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{u.name ?? '—'}</p>
                <p className="text-xs text-muted">{u.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted">{u.provider ?? 'credentials'}</span>
                {u.role === 'SUPERADMIN' && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary font-medium">
                    Admin
                  </span>
                )}
                <span className="text-xs text-muted">
                  {new Date(u.createdAt).toLocaleDateString('es-ES')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AdminPage
