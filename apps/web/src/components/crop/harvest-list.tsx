'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import type { HarvestRecord } from '@brotia/db'

export const HarvestList = ({ cropId, records }: { cropId: string; records: HarvestRecord[] }) => {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (harvestId: string) => {
    if (!confirm('¿Eliminar esta recogida?')) return
    setDeleting(harvestId)
    try {
      await fetch(`/api/crops/${cropId}/harvests?harvestId=${harvestId}`, { method: 'DELETE' })
      router.refresh()
    } finally {
      setDeleting(null)
    }
  }

  if (records.length === 0) {
    return (
      <p className="text-xs text-subtle flex items-center gap-1.5">
        <span>🌾</span> Sin recogidas registradas aún.
      </p>
    )
  }

  return (
    <ul className="flex flex-col gap-1">
      {records.map(r => (
        <li key={r.id} className="flex items-center justify-between text-sm py-2 border-b border-border-subtle last:border-0">
          <div className="flex items-center gap-2">
            <span className="text-base leading-none">⚖️</span>
            <span className="font-semibold text-foreground">{r.kg.toFixed(1)} kg</span>
            {r.notes ? <span className="text-xs text-subtle hidden sm:inline">— {r.notes}</span> : null}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-subtle">
              📅 {new Date(r.harvestedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
            </span>
            <button
              onClick={() => handleDelete(r.id)}
              disabled={deleting === r.id}
              className="text-subtle hover:text-danger-text transition-colors disabled:opacity-50"
              aria-label="Eliminar recogida"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
