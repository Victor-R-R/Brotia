'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

type GreenhouseOption = { id: string; name: string }

const inputClass =
  'w-full bg-surface border border-border rounded-md px-3 py-2.5 text-sm text-foreground placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary'

const NewCropPage = () => {
  const router = useRouter()
  const [name,              setName]              = useState('')
  const [variety,           setVariety]           = useState('')
  const [plantedAt,         setPlantedAt]         = useState('')
  const [expectedHarvestAt, setExpectedHarvestAt] = useState('')
  const [harvestedAt,       setHarvestedAt]       = useState('')
  const [greenhouseId,      setGreenhouseId]      = useState('')
  const [greenhouses,       setGreenhouses]       = useState<GreenhouseOption[]>([])
  const [loading,           setLoading]           = useState(false)
  const [error,             setError]             = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/greenhouses')
        if (res.ok) {
          const data = await res.json() as GreenhouseOption[]
          setGreenhouses(data)
          if (data.length > 0) setGreenhouseId(data[0].id)
        }
      } catch { /* silent — select will show empty */ }
    }
    load()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const body: Record<string, unknown> = {
        name,
        greenhouseId,
        plantedAt: new Date(plantedAt).toISOString(),
      }
      if (variety.trim())           body.variety           = variety.trim()
      if (expectedHarvestAt.trim()) body.expectedHarvestAt = new Date(expectedHarvestAt).toISOString()
      if (harvestedAt.trim())       body.harvestedAt       = new Date(harvestedAt).toISOString()

      const res = await fetch('/api/crops', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data?.error ?? 'Error al crear el cultivo')
        return
      }

      router.push('/cultivos')
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="font-heading text-2xl font-bold text-foreground mb-6">Nuevo cultivo</h1>

      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-lg p-6 flex flex-col gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1.5">
            Nombre del cultivo
          </label>
          <input
            id="name" type="text" value={name} required
            onChange={e => setName(e.target.value)}
            placeholder="Tomates cherry"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="variety" className="block text-sm font-medium text-foreground mb-1.5">
            Variedad <span className="text-subtle font-normal">— opcional</span>
          </label>
          <input
            id="variety" type="text" value={variety}
            onChange={e => setVariety(e.target.value)}
            placeholder="Roma"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="greenhouse" className="block text-sm font-medium text-foreground mb-1.5">
            Invernadero
          </label>
          <select
            id="greenhouse" value={greenhouseId} required
            onChange={e => setGreenhouseId(e.target.value)}
            className={inputClass}
          >
            {greenhouses.length === 0 ? (
              <option value="">Cargando invernaderos…</option>
            ) : (
              greenhouses.map(gh => (
                <option key={gh.id} value={gh.id}>{gh.name}</option>
              ))
            )}
          </select>
        </div>

        <div>
          <label htmlFor="plantedAt" className="block text-sm font-medium text-foreground mb-1.5">
            Fecha de plantación
          </label>
          <input
            id="plantedAt" type="date" value={plantedAt} required
            onChange={e => setPlantedAt(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="expectedHarvestAt" className="block text-sm font-medium text-foreground mb-1.5">
            Cosecha prevista <span className="text-subtle font-normal">— opcional</span>
          </label>
          <input
            id="expectedHarvestAt" type="date" value={expectedHarvestAt}
            onChange={e => setExpectedHarvestAt(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="harvestedAt" className="block text-sm font-medium text-foreground mb-1.5">
            Fecha de fin de cultivo <span className="text-subtle font-normal">— opcional</span>
          </label>
          <input
            id="harvestedAt" type="date" value={harvestedAt}
            onChange={e => setHarvestedAt(e.target.value)}
            className={inputClass}
          />
        </div>

        {error ? (
          <div className="text-sm text-danger-text bg-danger rounded-md px-3 py-2">{error}</div>
        ) : null}

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" loading={loading}>Crear cultivo</Button>
          <Button type="button" variant="ghost" onClick={() => router.back()}>Cancelar</Button>
        </div>
      </form>
    </div>
  )
}

export default NewCropPage
