'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

const inputClass =
  'w-full bg-surface border border-border rounded-md px-3 py-2.5 text-sm text-foreground ' +
  'placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary'

const GreenhouseEditPage = () => {
  const router    = useRouter()
  const { id }    = useParams<{ id: string }>()
  const [name,    setName]    = useState('')
  const [area,    setArea]    = useState('')
  const [loading, setLoading] = useState(false)
  const [fetched, setFetched] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/greenhouses/${id}`)
      .then(r => r.json())
      .then(gh => {
        setName(gh.name ?? '')
        setArea(gh.area != null ? String(gh.area) : '')
        setFetched(true)
      })
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (area.trim() !== '') {
      const parsed = parseFloat(area)
      if (isNaN(parsed) || parsed <= 0) { setError('Superficie no válida.'); return }
    }

    setLoading(true)
    try {
      const body: Record<string, unknown> = { name }
      if (area.trim()) body.area = parseFloat(area)

      const res = await fetch(`/api/greenhouses/${id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data?.error ?? 'Error al guardar')
        return
      }

      router.push(`/greenhouse/${id}`)
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

      <h1 className="font-heading text-2xl font-bold text-foreground mb-6">Editar invernadero</h1>

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
          <label htmlFor="area" className="block text-sm font-medium text-foreground mb-1.5">
            Superficie (m²)
            <span className="text-subtle font-normal ml-1">— opcional</span>
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
          <div className="text-sm text-danger-text bg-danger rounded-md px-3 py-2">{error}</div>
        ) : null}

        <Button type="submit" loading={loading} className="w-full">Guardar cambios</Button>
      </form>
    </div>
  )
}

export default GreenhouseEditPage
