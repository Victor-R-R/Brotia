import { auth } from '@/lib/auth'
import { db } from '@brotia/db'
import { RoleToggle } from '@/components/admin/role-toggle'
import { UserActions } from '@/components/admin/user-actions'

const AdminUsersPage = async () => {
  const session = await auth()

  const users = await db.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      lastName: true,
      email: true,
      role: true,
      provider: true,
      createdAt: true,
      _count: {
        select: { greenhouses: true },
      },
    },
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">Usuarios</h1>
        <p className="text-sm text-muted mt-1">{users.length} usuarios registrados</p>
      </div>

      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-alt">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted uppercase tracking-wide">Usuario</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted uppercase tracking-wide hidden md:table-cell">Proveedor</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted uppercase tracking-wide hidden lg:table-cell">Invernaderos</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted uppercase tracking-wide hidden md:table-cell">Registro</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted uppercase tracking-wide">Rol</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-surface-alt transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">
                    {[u.name, u.lastName].filter(Boolean).join(' ') || '—'}
                  </p>
                  <p className="text-xs text-muted">{u.email}</p>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="text-muted">{u.provider ?? 'email'}</span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell text-muted">
                  {u._count.greenhouses}
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-muted">
                  {new Date(u.createdAt).toLocaleDateString('es-ES')}
                </td>
                <td className="px-4 py-3">
                  <RoleToggle
                    userId={u.id}
                    currentRole={u.role}
                    isSelf={u.id === session?.user?.id}
                  />
                </td>
                <td className="px-4 py-3">
                  <UserActions
                    userId={u.id}
                    userName={[u.name, u.lastName].filter(Boolean).join(' ') || u.email}
                    isSelf={u.id === session?.user?.id}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminUsersPage
