'use client'

import { useState, useMemo } from 'react'
import type { ReactNode } from 'react'
import { BarChart2, Download, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { HarvestBarChart } from './harvest-bar-chart'
import { CropTotalsChart } from './crop-totals-chart'
import { GreenhouseComparisonChart } from './greenhouse-comparison-chart'
import { CropStatusChart } from './crop-status-chart'
import { PestFrequencyChart } from './pest-frequency-chart'
import { AlertsByTypeChart } from './alerts-by-type-chart'

export type Greenhouse = { id: string; name: string }

export type HarvestEntry = {
  cropName: string
  greenhouseId: string
  greenhouseName: string
  kg: number
  harvestedAt: string
}

export type PestEntry = {
  pestName: string
  severity: string
  detectedAt: string
  greenhouseId: string
}

export type AlertEntry = {
  type: string
  severity: string
  triggeredAt: string
  greenhouseId: string
}

export type CropEntry = {
  status: string
  greenhouseId: string
}

type Props = {
  greenhouses: Greenhouse[]
  harvestEntries: HarvestEntry[]
  pestEntries: PestEntry[]
  alertEntries: AlertEntry[]
  cropEntries: CropEntry[]
}

const TrendBadge = ({
  current,
  prev,
  compareLabel = 'año anterior',
}: {
  current: number
  prev: number
  compareLabel?: string
}) => {
  if (prev === 0 && current === 0) return null
  if (prev === 0) return <span className="text-xs text-muted">Sin dato anterior</span>
  const pct = ((current - prev) / prev) * 100
  if (Math.abs(pct) < 0.5) {
    return (
      <span className="flex items-center gap-0.5 text-xs text-muted">
        <Minus className="size-3" />igual que {compareLabel}
      </span>
    )
  }
  const up = pct > 0
  return (
    <span
      className={`flex items-center gap-0.5 text-xs font-medium ${
        up ? 'text-primary' : 'text-danger-text'
      }`}
    >
      {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
      {up ? '+' : ''}{pct.toFixed(0)}% vs {compareLabel}
    </span>
  )
}

const KpiCard = ({ label, value, trend }: { label: string; value: string; trend?: ReactNode }) => (
  <div className="bg-surface border border-border rounded-lg p-4">
    <p className="text-xs text-subtle uppercase tracking-wide font-medium">{label}</p>
    <p className="font-heading text-2xl font-bold text-foreground mt-1">{value}</p>
    {trend !== undefined && <div className="mt-1.5">{trend}</div>}
  </div>
)

const PILL_BASE = 'px-3 py-1.5 rounded-full text-sm font-medium transition-colors'
const PILL_ACTIVE = 'bg-primary text-white'
const PILL_INACTIVE = 'bg-surface-alt text-muted border border-border hover:text-foreground'

export const EstadisticasDashboard = ({
  greenhouses,
  harvestEntries,
  pestEntries,
  alertEntries,
  cropEntries,
}: Props) => {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)

  const availableYears = useMemo(() => {
    const years = new Set<number>()
    harvestEntries.forEach(e => years.add(new Date(e.harvestedAt).getFullYear()))
    pestEntries.forEach(e => years.add(new Date(e.detectedAt).getFullYear()))
    alertEntries.forEach(e => years.add(new Date(e.triggeredAt).getFullYear()))
    return Array.from(years).sort((a, b) => b - a)
  }, [harvestEntries, pestEntries, alertEntries])

  const fHarvest = useMemo(() => {
    let r = selectedId ? harvestEntries.filter(e => e.greenhouseId === selectedId) : harvestEntries
    if (selectedYear !== null) r = r.filter(e => new Date(e.harvestedAt).getFullYear() === selectedYear)
    return r
  }, [harvestEntries, selectedId, selectedYear])

  const fPest = useMemo(() => {
    let r = selectedId ? pestEntries.filter(e => e.greenhouseId === selectedId) : pestEntries
    if (selectedYear !== null) r = r.filter(e => new Date(e.detectedAt).getFullYear() === selectedYear)
    return r
  }, [pestEntries, selectedId, selectedYear])

  const fAlert = useMemo(() => {
    let r = selectedId ? alertEntries.filter(e => e.greenhouseId === selectedId) : alertEntries
    if (selectedYear !== null) r = r.filter(e => new Date(e.triggeredAt).getFullYear() === selectedYear)
    return r
  }, [alertEntries, selectedId, selectedYear])

  const statusCounts = useMemo(() => {
    const filtered = selectedId ? cropEntries.filter(c => c.greenhouseId === selectedId) : cropEntries
    return ['GROWING', 'HARVESTED', 'FAILED'].map(status => ({
      status,
      count: filtered.filter(c => c.status === status).length,
    }))
  }, [cropEntries, selectedId])

  const totalKg = fHarvest.reduce((sum, e) => sum + e.kg, 0)
  const activeCrops = statusCounts.find(s => s.status === 'GROWING')?.count ?? 0
  const harvestedCrops = statusCounts.find(s => s.status === 'HARVESTED')?.count ?? 0

  // Trend: activeYear vs activeYear-1 (independent of year filter for context)
  const activeYear = selectedYear ?? new Date().getFullYear()
  const compareLabel = selectedYear ? String(selectedYear - 1) : 'año anterior'

  const kgThisYear = useMemo(() => {
    const base = selectedId ? harvestEntries.filter(e => e.greenhouseId === selectedId) : harvestEntries
    return base
      .filter(e => new Date(e.harvestedAt).getFullYear() === activeYear)
      .reduce((s, e) => s + e.kg, 0)
  }, [harvestEntries, selectedId, activeYear])

  const kgPrevYear = useMemo(() => {
    const base = selectedId ? harvestEntries.filter(e => e.greenhouseId === selectedId) : harvestEntries
    return base
      .filter(e => new Date(e.harvestedAt).getFullYear() === activeYear - 1)
      .reduce((s, e) => s + e.kg, 0)
  }, [harvestEntries, selectedId, activeYear])

  const countThisYear = useMemo(() => {
    const base = selectedId ? harvestEntries.filter(e => e.greenhouseId === selectedId) : harvestEntries
    return base.filter(e => new Date(e.harvestedAt).getFullYear() === activeYear).length
  }, [harvestEntries, selectedId, activeYear])

  const countPrevYear = useMemo(() => {
    const base = selectedId ? harvestEntries.filter(e => e.greenhouseId === selectedId) : harvestEntries
    return base.filter(e => new Date(e.harvestedAt).getFullYear() === activeYear - 1).length
  }, [harvestEntries, selectedId, activeYear])

  const exportCSV = () => {
    const headers = ['Fecha', 'Cultivo', 'Invernadero', 'kg']
    const rows = fHarvest.map(e => [
      new Date(e.harvestedAt).toLocaleDateString('es-ES'),
      e.cropName,
      e.greenhouseName,
      e.kg.toFixed(2),
    ])
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c)}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `brotia-estadisticas${selectedYear ? `-${selectedYear}` : ''}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const hasAnyData =
    harvestEntries.length > 0 || pestEntries.length > 0 || alertEntries.length > 0

  return (
    <div>
      {/* Filters + export */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        {availableYears.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedYear(null)}
              className={`${PILL_BASE} ${selectedYear === null ? PILL_ACTIVE : PILL_INACTIVE}`}
            >
              Todos los años
            </button>
            {availableYears.map(y => (
              <button
                key={y}
                onClick={() => setSelectedYear(y)}
                className={`${PILL_BASE} ${selectedYear === y ? PILL_ACTIVE : PILL_INACTIVE}`}
              >
                {y}
              </button>
            ))}
          </div>
        )}
        <button
          onClick={exportCSV}
          disabled={fHarvest.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-surface border border-border text-muted hover:text-foreground hover:border-primary/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download className="size-3.5" />
          Exportar CSV
        </button>
      </div>

      {/* Greenhouse filter */}
      {greenhouses.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedId(null)}
            className={`${PILL_BASE} ${selectedId === null ? PILL_ACTIVE : PILL_INACTIVE}`}
          >
            Todos
          </button>
          {greenhouses.map(g => (
            <button
              key={g.id}
              onClick={() => setSelectedId(g.id)}
              className={`${PILL_BASE} ${selectedId === g.id ? PILL_ACTIVE : PILL_INACTIVE}`}
            >
              {g.name}
            </button>
          ))}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <KpiCard
          label="Total cosechado"
          value={`${totalKg.toFixed(1)} kg`}
          trend={<TrendBadge current={kgThisYear} prev={kgPrevYear} compareLabel={compareLabel} />}
        />
        <KpiCard
          label="Registros cosecha"
          value={String(fHarvest.length)}
          trend={
            <TrendBadge current={countThisYear} prev={countPrevYear} compareLabel={compareLabel} />
          }
        />
        <KpiCard label="Cultivos activos" value={String(activeCrops)} />
        <KpiCard label="Cosechados" value={String(harvestedCrops)} />
      </div>

      {!hasAnyData ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <BarChart2 className="size-10 text-muted mb-4" />
          <p className="text-muted font-medium">Sin datos todavía</p>
          <p className="text-sm text-subtle mt-1">
            Las estadísticas aparecerán aquí cuando registres cosechas, plagas o recibas alertas.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <HarvestBarChart entries={fHarvest} year={selectedYear ?? undefined} />
            <CropTotalsChart entries={fHarvest} />
          </div>
          <div className={`grid grid-cols-1 gap-6 ${selectedId === null ? 'lg:grid-cols-2' : ''}`}>
            {selectedId === null && <GreenhouseComparisonChart entries={fHarvest} />}
            <CropStatusChart statusCounts={statusCounts} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PestFrequencyChart entries={fPest} />
            <AlertsByTypeChart entries={fAlert} />
          </div>
        </div>
      )}
    </div>
  )
}
