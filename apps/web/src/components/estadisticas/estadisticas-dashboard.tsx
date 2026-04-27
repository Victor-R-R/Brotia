'use client'

import { useState, useMemo } from 'react'
import { BarChart2 } from 'lucide-react'
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

const KpiCard = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-surface border border-border rounded-lg p-4">
    <p className="text-xs text-subtle uppercase tracking-wide font-medium">{label}</p>
    <p className="font-heading text-2xl font-bold text-foreground mt-1">{value}</p>
  </div>
)

export const EstadisticasDashboard = ({
  greenhouses,
  harvestEntries,
  pestEntries,
  alertEntries,
  cropEntries,
}: Props) => {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const fHarvest = useMemo(
    () => selectedId ? harvestEntries.filter(e => e.greenhouseId === selectedId) : harvestEntries,
    [harvestEntries, selectedId],
  )

  const fPest = useMemo(
    () => selectedId ? pestEntries.filter(e => e.greenhouseId === selectedId) : pestEntries,
    [pestEntries, selectedId],
  )

  const fAlert = useMemo(
    () => selectedId ? alertEntries.filter(e => e.greenhouseId === selectedId) : alertEntries,
    [alertEntries, selectedId],
  )

  const statusCounts = useMemo(() => {
    const filtered = selectedId
      ? cropEntries.filter(c => c.greenhouseId === selectedId)
      : cropEntries
    return ['GROWING', 'HARVESTED', 'FAILED'].map(status => ({
      status,
      count: filtered.filter(c => c.status === status).length,
    }))
  }, [cropEntries, selectedId])

  const totalKg = fHarvest.reduce((sum, e) => sum + e.kg, 0)
  const activeCrops = statusCounts.find(s => s.status === 'GROWING')?.count ?? 0
  const harvestedCrops = statusCounts.find(s => s.status === 'HARVESTED')?.count ?? 0

  const hasAnyData =
    harvestEntries.length > 0 ||
    pestEntries.length > 0 ||
    alertEntries.length > 0

  return (
    <div>
      {/* Filtro por invernadero */}
      {greenhouses.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedId(null)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedId === null
                ? 'bg-primary text-white'
                : 'bg-surface-alt text-muted border border-border hover:text-foreground'
            }`}
          >
            Todos
          </button>
          {greenhouses.map(g => (
            <button
              key={g.id}
              onClick={() => setSelectedId(g.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedId === g.id
                  ? 'bg-primary text-white'
                  : 'bg-surface-alt text-muted border border-border hover:text-foreground'
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Total cosechado" value={`${totalKg.toFixed(1)} kg`} />
        <KpiCard label="Registros cosecha" value={String(fHarvest.length)} />
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
          {/* Fila 1 — Producción mensual + Por cultivo */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <HarvestBarChart entries={fHarvest} />
            <CropTotalsChart entries={fHarvest} />
          </div>

          {/* Fila 2 — Comparación invernaderos (solo "Todos") + Estado */}
          <div className={`grid grid-cols-1 gap-6 ${selectedId === null ? 'lg:grid-cols-2' : ''}`}>
            {selectedId === null && <GreenhouseComparisonChart entries={fHarvest} />}
            <CropStatusChart statusCounts={statusCounts} />
          </div>

          {/* Fila 3 — Plagas + Alertas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PestFrequencyChart entries={fPest} />
            <AlertsByTypeChart entries={fAlert} />
          </div>
        </div>
      )}
    </div>
  )
}
