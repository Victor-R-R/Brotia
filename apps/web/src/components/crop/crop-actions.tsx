'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2 } from 'lucide-react'

export const CropActions = ({ id }: { id: string }) => {
  const router     = useRouter()
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('¿Eliminar este cultivo?')) return
    setDeleting(true)
    try {
      await fetch(`/api/crops/${id}`, { method: 'DELETE' })
      router.refresh()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border-subtle">
      <button
        onClick={() => router.push(`/cultivos/${id}/edit`)}
        className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border border-border text-muted hover:text-foreground hover:border-primary/50 transition-colors cursor-pointer"
      >
        <Pencil className="size-3" />
        Editar
      </button>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border border-border text-muted hover:text-danger-text hover:border-danger transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
      >
        <Trash2 className="size-3" />
        {deleting ? 'Eliminando…' : 'Eliminar'}
      </button>
    </div>
  )
}
