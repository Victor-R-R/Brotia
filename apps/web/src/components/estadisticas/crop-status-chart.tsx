'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

type StatusCount = {
  status: string
  count: number
}

type Props = { statusCounts: StatusCount[] }

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  GROWING:   { label: 'En crecimiento', color: '#2D5A1B' },
  HARVESTED: { label: 'Cosechados',     color: '#8DB84A' },
  FAILED:    { label: 'Fallidos',       color: '#FCA5A5' },
}

export const CropStatusChart = ({ statusCounts }: Props) => {
  const data = statusCounts
    .filter(s => s.count > 0)
    .map(s => ({
      name: STATUS_CONFIG[s.status]?.label ?? s.status,
      value: s.count,
      color: STATUS_CONFIG[s.status]?.color ?? '#A8C185',
    }))

  if (data.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-lg p-4 flex items-center justify-center h-[300px]">
        <p className="text-sm text-subtle">Sin cultivos registrados</p>
      </div>
    )
  }

  const total = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <div className="mb-4">
        <h2 className="font-heading text-base font-semibold text-foreground">Estado de cultivos</h2>
        <p className="text-xs text-subtle">{total} cultivos en total</p>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #C8DEB5',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            formatter={(v) => [`${v} cultivos`, '']}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => <span style={{ fontSize: 11, color: '#4B6838' }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
