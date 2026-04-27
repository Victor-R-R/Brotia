'use client'

import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

type AlertEntry = {
  type: string
  severity: string
  triggeredAt: string
}

type Props = { entries: AlertEntry[] }

const ALERT_CONFIG: Record<string, { label: string; color: string }> = {
  FROST:          { label: 'Helada',         color: '#0369A1' },
  HAIL:           { label: 'Granizo',        color: '#3730A3' },
  STRONG_WIND:    { label: 'Viento fuerte',  color: '#92400E' },
  HIGH_HUMIDITY:  { label: 'Humedad alta',   color: '#0891B2' },
  RAIN_EXPECTED:  { label: 'Lluvia',         color: '#1D4ED8' },
}

export const AlertsByTypeChart = ({ entries }: Props) => {
  const data = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const e of entries) {
      counts[e.type] = (counts[e.type] ?? 0) + 1
    }
    return Object.entries(counts)
      .map(([type, count]) => ({
        tipo: ALERT_CONFIG[type]?.label ?? type,
        count,
        color: ALERT_CONFIG[type]?.color ?? '#2D5A1B',
      }))
      .sort((a, b) => b.count - a.count)
  }, [entries])

  if (data.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-lg p-4 flex items-center justify-center h-[300px]">
        <p className="text-sm text-subtle">Sin alertas meteorológicas</p>
      </div>
    )
  }

  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <div className="mb-4">
        <h2 className="font-heading text-base font-semibold text-foreground">Alertas meteorológicas</h2>
        <p className="text-xs text-subtle">{entries.length} alertas en total</p>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#C8DEB5" />
          <XAxis
            dataKey="tipo"
            tick={{ fontSize: 10, fill: '#7A9B6A' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#7A9B6A' }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #C8DEB5',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            formatter={(v) => [`${v} alertas`, 'Total']}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
