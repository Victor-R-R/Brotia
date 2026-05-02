'use client'

import type { PestRecord } from '@brotia/db'

const severityConfig: Record<string, { label: string; emoji: string; className: string }> = {
  low:    { label: 'Leve',     emoji: '🟡', className: 'bg-surface-alt text-muted'       },
  medium: { label: 'Moderada', emoji: '🟠', className: 'bg-wind text-wind-text'           },
  high:   { label: 'Grave',    emoji: '🔴', className: 'bg-danger text-danger-text'       },
}

export const PestList = ({ records }: { cropId: string; records: PestRecord[] }) => {
  if (records.length === 0) {
    return <p className="text-xs text-subtle">Sin plagas registradas. ¡Buena señal! 🌿</p>
  }

  return (
    <ul className="flex flex-col gap-1">
      {records.map(r => {
        const sev = severityConfig[r.severity] ?? severityConfig.low
        return (
          <li key={r.id} className="flex items-start justify-between text-sm py-2 border-b border-border-subtle last:border-0">
            <div className="flex items-center gap-2">
              <span className="text-base leading-none">🐛</span>
              <div>
                <span className="font-medium text-foreground">{r.pestName}</span>
                {r.notes ? <p className="text-xs text-subtle mt-0.5">{r.notes}</p> : null}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-2">
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1 ${sev.className}`}>
                {sev.emoji} {sev.label}
              </span>
              <span className="text-xs text-subtle">
                📅 {new Date(r.detectedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
              </span>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
