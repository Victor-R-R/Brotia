'use client'

import { Bug } from 'lucide-react'
import type { PestRecord } from '@brotia/db'

const severityClass: Record<string, string> = {
  low:    'bg-surface-alt text-muted',
  medium: 'bg-wind text-wind-text',
  high:   'bg-danger text-danger-text',
}

const severityLabel: Record<string, string> = {
  low:    'Leve',
  medium: 'Moderada',
  high:   'Grave',
}

export const PestList = ({ records }: { cropId: string; records: PestRecord[] }) => {
  if (records.length === 0) {
    return <p className="text-xs text-subtle">Sin plagas registradas. ¡Buena señal! 🌿</p>
  }

  return (
    <ul className="flex flex-col gap-2">
      {records.map(r => (
        <li key={r.id} className="flex items-start justify-between text-sm py-1.5 border-b border-border-subtle last:border-0">
          <div className="flex items-center gap-2">
            <Bug className="size-3.5 text-muted shrink-0 mt-0.5" />
            <div>
              <span className="font-medium text-foreground">{r.pestName}</span>
              {r.notes ? <p className="text-xs text-subtle mt-0.5">{r.notes}</p> : null}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${severityClass[r.severity]}`}>
              {severityLabel[r.severity]}
            </span>
            <span className="text-xs text-subtle">
              {new Date(r.detectedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
            </span>
          </div>
        </li>
      ))}
    </ul>
  )
}
