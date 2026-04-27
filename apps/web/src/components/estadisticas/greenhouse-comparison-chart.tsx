'use client'

import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

type HarvestEntry = {
  cropName: string
  greenhouseName: string
  kg: number
  harvestedAt: string
}

type Props = { entries: HarvestEntry[] }

const PALETTE = ['#2D5A1B', '#3D7525', '#5A9E3E', '#8DB84A', '#6B7C3D']

export const GreenhouseComparisonChart = ({ entries }: Props) => {
  const data = useMemo(() => {
    const totals: Record<string, number> = {}
    for (const e of entries) {
      totals[e.greenhouseName] = (totals[e.greenhouseName] ?? 0) + e.kg
    }
    return Object.entries(totals)
      .map(([invernadero, kg]) => ({ invernadero, kg }))
      .sort((a, b) => b.kg - a.kg)
  }, [entries])

  if (data.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-lg p-4 flex items-center justify-center h-[300px]">
        <p className="text-sm text-subtle">Sin datos de cosecha</p>
      </div>
    )
  }

  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <div className="mb-4">
        <h2 className="font-heading text-base font-semibold text-foreground">Por invernadero</h2>
        <p className="text-xs text-subtle">kg totales por invernadero</p>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#C8DEB5" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: '#7A9B6A' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="invernadero"
            tick={{ fontSize: 11, fill: '#7A9B6A' }}
            axisLine={false}
            tickLine={false}
            width={90}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #C8DEB5',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            formatter={(v) => [`${Number(v).toFixed(1)} kg`, 'Producción']}
          />
          <Bar dataKey="kg" radius={[0, 4, 4, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
