'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

const inputClass =
  'w-full bg-surface border border-border rounded-md px-3 py-2.5 text-sm text-foreground placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary'

const NewGreenhousePage = () => {
  const router  = useRouter()
  const [name,    setName]    = useState('')
  const [lat,     setLat]     = useState('')
  const [lng,     setLng]     = useState('')
  const [area,    setArea]    = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const parsedLat = parseFloat(lat)
    const parsedLng = parseFloat(lng)

    if (
      isNaN(parsedLat) || parsedLat < -90  || parsedLat > 90  ||
      isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180
    ) {
      setError('Coordenadas no válidas. Latitud: −90 a 90, Longitud: −180 a 180.')
      setLoading(false)
      return
    }

    if (area.trim() !== '') {
      const parsedArea = parseFloat(area)
      if (isNaN(parsedArea) || parsedArea <= 0) {
        setError('Superficie no válida.')
        setLoading(false)
        return
      }
    }

    try {
      const body: Record<string, unknown> = {
        name,
        lat:  parsedLat,
        lng:  parsedLng,
      }
      if (area.trim() !== '') {
        body.area = parseFloat(area)
      }

      const res = await fetch('/api/greenhouses', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data?.error ?? 'Error al crear el invernadero')
        return
      }

      const greenhouse = await res.json()
      router.push(`/greenhouse/${greenhouse.id}`)
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="font-heading text-2xl font-bold text-foreground mb-6">
        Nuevo invernadero
      </h1>

      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-lg p-6 flex flex-col gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1.5">
            Nombre
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Invernadero Norte"
            required
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="lat" className="block text-sm font-medium text-foreground mb-1.5">
              Latitud
            </label>
            <input
              id="lat"
              type="number"
              step="any"
              value={lat}
              onChange={e => setLat(e.target.value)}
              placeholder="40.4168"
              required
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="lng" className="block text-sm font-medium text-foreground mb-1.5">
              Longitud
            </label>
            <input
              id="lng"
              type="number"
              step="any"
              value={lng}
              onChange={e => setLng(e.target.value)}
              placeholder="-3.7038"
              required
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="area" className="block text-sm font-medium text-foreground mb-1.5">
            Superficie (m²) <span className="text-subtle font-normal">— opcional</span>
          </label>
          <input
            id="area"
            type="number"
            step="any"
            min="0"
            value={area}
            onChange={e => setArea(e.target.value)}
            placeholder="500"
            className={inputClass}
          />
        </div>

        {error ? (
          <div className="text-sm text-danger-text bg-danger rounded-md px-3 py-2">
            {error}
          </div>
        ) : null}

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" loading={loading}>
            Crear invernadero
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.back()}>Cancelar</Button>
        </div>
      </form>
    </div>
  )
}

export default NewGreenhousePage
