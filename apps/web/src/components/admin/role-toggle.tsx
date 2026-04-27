'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  userId: string
  currentRole: string
  isSelf: boolean
}

export const RoleToggle = ({ userId, currentRole, isSelf }: Props) => {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  if (isSelf) {
    return (
      <span className="text-xs px-2 py-1 rounded-full bg-primary/15 text-primary font-medium">
        Tú (Admin)
      </span>
    )
  }

  const isSuperadmin = currentRole === 'SUPERADMIN'

  const toggle = async () => {
    setLoading(true)
    await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: isSuperadmin ? 'USER' : 'SUPERADMIN' }),
    })
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`text-xs px-2 py-1 rounded-full font-medium transition-colors disabled:opacity-50 ${
        isSuperadmin
          ? 'bg-primary/15 text-primary hover:bg-primary/25'
          : 'bg-surface-alt text-muted hover:text-foreground hover:bg-surface-alt'
      }`}
    >
      {loading ? '...' : isSuperadmin ? 'Admin' : 'Usuario'}
    </button>
  )
}
