'use client'

import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

type PestEntry = {
  pestName: string
  severity: string
  detectedAt: string
}

type Props = { entries: PestEntry[] }

const SEVERITY_COLOR: Record<string, string> = {
  low:    '#4DBB5A',
  medium: '#CA8A04',
  high:   '#DC2626',
}

export const PestFrequencyChart = ({ entries }: Props) => {
  const data = useMemo(() => {
    const counts: Record<string, { count: number; topSeverity: string }> = {}
    for (const e of entries) {
      if (!counts[e.pestName]) {
        counts[e.pestName] = { count: 0, topSeverity: e.severity }
      }
      counts[e.pestName].count++
      if (e.severity === 'high') counts[e.pestName].topSeverity = 'high'
      else if (e.severity === 'medium' && counts[e.pestName].topSeverity !== 'high') {
        counts[e.pestName].topSeverity = 'medium'
      }
    }
    return Object.entries(counts)
      .map(([plaga, { count, topSeverity }]) => ({ plaga, count, topSeverity }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
  }, [entries])

  if (data.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-lg p-4 flex items-center justify-center h-[300px]">
        <p className="text-sm text-subtle">Sin registros de plagas</p>
      </div>
    )
  }

  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <div className="mb-4">
        <h2 className="font-heading text-base font-semibold text-foreground">Plagas más frecuentes</h2>
        <p className="text-xs text-subtle">número de detecciones registradas</p>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#9ED4A6" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: '#4E8A58' }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="plaga"
            tick={{ fontSize: 11, fill: '#4E8A58' }}
            axisLine={false}
            tickLine={false}
            width={90}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #9ED4A6',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            formatter={(v) => [`${v} detecciones`, 'Frecuencia']}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={SEVERITY_COLOR[entry.topSeverity] ?? '#4DBB5A'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="text-xs text-subtle mt-2">
        Color indica la severidad máxima registrada:
        <span className="ml-1 text-[#4DBB5A]">● baja</span>
        <span className="ml-1 text-[#CA8A04]">● media</span>
        <span className="ml-1 text-[#DC2626]">● alta</span>
      </p>
    </div>
  )
}
