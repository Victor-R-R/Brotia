'use client'

import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'

type HarvestEntry = {
  cropName: string
  kg: number
  harvestedAt: string
}

type Props = {
  entries: HarvestEntry[]
  /** When provided, the chart uses this year and hides the internal year selector */
  year?: number
}

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

export const HarvestBarChart = ({ entries, year }: Props) => {
  const years = useMemo(() => {
    const set = new Set(entries.map(e => new Date(e.harvestedAt).getFullYear()))
    return Array.from(set).sort((a, b) => b - a)
  }, [entries])

  const [internalYear, setInternalYear] = useState<number | null>(null)
  const effectiveYear = year ?? internalYear ?? years[0] ?? new Date().getFullYear()

  const data = useMemo(() => {
    return MESES.map((mes, i) => ({
      mes,
      kg: entries
        .filter(e => new Date(e.harvestedAt).getFullYear() === effectiveYear)
        .filter(e => new Date(e.harvestedAt).getMonth() === i)
        .reduce((sum, e) => sum + e.kg, 0),
    }))
  }, [entries, effectiveYear])

  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-heading text-base font-semibold text-foreground">Producción mensual</h2>
          <p className="text-xs text-subtle">kg cosechados por mes · {effectiveYear}</p>
        </div>
        {year === undefined && years.length > 1 && (
          <select
            value={effectiveYear}
            onChange={e => setInternalYear(Number(e.target.value))}
            className="text-sm bg-surface-alt border border-border rounded-md px-2 py-1 text-foreground"
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        )}
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#C8DEB5" />
          <XAxis
            dataKey="mes"
            tick={{ fontSize: 11, fill: '#7A9B6A' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#7A9B6A' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #C8DEB5',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            formatter={(v) => [`${Number(v).toFixed(1)} kg`, 'Cosechado']}
          />
          <Bar dataKey="kg" fill="#2D5A1B" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
