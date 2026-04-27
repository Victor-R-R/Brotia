'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserRound, Trash2 } from 'lucide-react'

type Props = {
  userId: string
  userName: string
  isSelf: boolean
}

export const UserActions = ({ userId, userName, isSelf }: Props) => {
  const [deleting, setDeleting] = useState(false)
  const [impersonating, setImpersonating] = useState(false)
  const router = useRouter()

  if (isSelf) return null

  const handleImpersonate = async () => {
    setImpersonating(true)
    await fetch(`/api/admin/impersonate/${userId}`, { method: 'POST', redirect: 'follow' })
    router.push('/dashboard')
    router.refresh()
    setImpersonating(false)
  }

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar la cuenta de ${userName}? Esta acción es irreversible.`)) return
    setDeleting(true)
    await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
    router.refresh()
    setDeleting(false)
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={handleImpersonate}
        disabled={impersonating}
        title="Impersonar usuario"
        className="p-1.5 rounded-md text-muted hover:text-foreground hover:bg-surface-alt transition-colors disabled:opacity-50"
      >
        <UserRound className="size-4" />
      </button>
      <button
        onClick={handleDelete}
        disabled={deleting}
        title="Eliminar usuario"
        className="p-1.5 rounded-md text-muted hover:text-danger hover:bg-danger/10 transition-colors disabled:opacity-50"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  )
}
