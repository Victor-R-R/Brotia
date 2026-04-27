'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2 } from 'lucide-react'

export const GreenhouseActions = ({ id }: { id: string }) => {
  const router   = useRouter()
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('¿Eliminar este invernadero? Se perderán todos sus cultivos y notas.')) return
    setDeleting(true)
    try {
      await fetch(`/api/greenhouses/${id}`, { method: 'DELETE' })
      router.push('/')
      router.refresh()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => router.push(`/greenhouse/${id}/edit`)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-border text-muted hover:text-foreground hover:border-primary/50 transition-colors"
      >
        <Pencil className="size-3" />
        Editar
      </button>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-border text-muted hover:text-danger-text hover:border-danger transition-colors disabled:opacity-50"
      >
        <Trash2 className="size-3" />
        {deleting ? 'Eliminando…' : 'Eliminar'}
      </button>
    </div>
  )
}
