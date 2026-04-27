'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

const inputClass =
  'w-full bg-surface border border-border rounded-md px-3 py-2.5 text-sm text-foreground ' +
  'placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary'

const selectClass =
  'w-full bg-surface border border-border rounded-md px-3 py-2.5 text-sm text-foreground ' +
  'focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary'

type Status = 'GROWING' | 'HARVESTED' | 'FAILED'

const CropEditPage = () => {
  const router    = useRouter()
  const { id }    = useParams<{ id: string }>()
  const [name,              setName]              = useState('')
  const [variety,           setVariety]           = useState('')
  const [status,            setStatus]            = useState<Status>('GROWING')
  const [plantedAt,         setPlantedAt]         = useState('')
  const [expectedHarvestAt, setExpectedHarvestAt] = useState('')
  const [harvestedAt,       setHarvestedAt]       = useState('')
  const [loading,           setLoading]           = useState(false)
  const [fetched,           setFetched]           = useState(false)
  const [error,             setError]             = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/crops/${id}`)
      .then(r => r.json())
      .then(crop => {
        setName(crop.name ?? '')
        setVariety(crop.variety ?? '')
        setStatus(crop.status ?? 'GROWING')
        setPlantedAt(
          crop.plantedAt
            ? new Date(crop.plantedAt).toISOString().slice(0, 10)
            : ''
        )
        setExpectedHarvestAt(
          crop.expectedHarvestAt
            ? new Date(crop.expectedHarvestAt).toISOString().slice(0, 10)
            : ''
        )
        setHarvestedAt(
          crop.harvestedAt
            ? new Date(crop.harvestedAt).toISOString().slice(0, 10)
            : ''
        )
        setFetched(true)
      })
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const body: Record<string, unknown> = { name, status }
      if (variety.trim())           body.variety           = variety.trim()
      if (plantedAt.trim())         body.plantedAt         = new Date(plantedAt).toISOString()
      if (expectedHarvestAt.trim()) body.expectedHarvestAt = expectedHarvestAt
      if (harvestedAt.trim())       body.harvestedAt       = harvestedAt

      const res = await fetch(`/api/crops/${id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data?.error ?? 'Error al guardar')
        return
      }

      router.push('/cultivos')
      router.refresh()
    } catch {
      setError('Error de conexión.')
    } finally {
      setLoading(false)
    }
  }

  if (!fetched) {
    return <div className="text-sm text-subtle p-4">Cargando…</div>
  }

  return (
    <div className="max-w-md">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="size-4" />
        Volver
      </button>

      <h1 className="font-heading text-2xl font-bold text-foreground mb-6">Editar cultivo</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1.5">Nombre</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="variety" className="block text-sm font-medium text-foreground mb-1.5">
            Variedad
            <span className="text-subtle font-normal ml-1">— opcional</span>
          </label>
          <input
            id="variety"
            type="text"
            value={variety}
            onChange={e => setVariety(e.target.value)}
            placeholder="Ej: Cherry, Beefsteak…"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="plantedAt" className="block text-sm font-medium text-foreground mb-1.5">
            Fecha de siembra
          </label>
          <input
            id="plantedAt"
            type="date"
            value={plantedAt}
            onChange={e => setPlantedAt(e.target.value)}
            required
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-foreground mb-1.5">Estado</label>
          <select
            id="status"
            value={status}
            onChange={e => setStatus(e.target.value as Status)}
            className={selectClass}
          >
            <option value="GROWING">En crecimiento</option>
            <option value="HARVESTED">Cosechado</option>
            <option value="FAILED">Fallido</option>
          </select>
        </div>

        <div>
          <label htmlFor="harvest" className="block text-sm font-medium text-foreground mb-1.5">
            Cosecha prevista
            <span className="text-subtle font-normal ml-1">— opcional</span>
          </label>
          <input
            id="harvest"
            type="date"
            value={expectedHarvestAt}
            onChange={e => setExpectedHarvestAt(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="harvestedAt" className="block text-sm font-medium text-foreground mb-1.5">
            Fecha de fin de cultivo
            <span className="text-subtle font-normal ml-1">— opcional</span>
          </label>
          <input
            id="harvestedAt"
            type="date"
            value={harvestedAt}
            onChange={e => setHarvestedAt(e.target.value)}
            className={inputClass}
          />
        </div>

        {error ? (
          <div className="text-sm text-danger-text bg-danger rounded-md px-3 py-2">{error}</div>
        ) : null}

        <Button type="submit" loading={loading} className="w-full">Guardar cambios</Button>
      </form>
    </div>
  )
}

export default CropEditPage
