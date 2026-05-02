'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'

const inputClass =
  'bg-surface border border-border rounded-md px-3 py-2 text-sm text-foreground ' +
  'placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary'

export const AddHarvestForm = ({ cropId }: { cropId: string }) => {
  const router    = useRouter()
  const [open,    setOpen]    = useState(false)
  const [kg,      setKg]      = useState('')
  const [date,    setDate]    = useState('')
  const [notes,   setNotes]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const parsedKg = parseFloat(kg)
    if (isNaN(parsedKg) || parsedKg <= 0) { setError('Introduce un peso válido.'); return }

    setLoading(true)
    try {
      const body: Record<string, unknown> = { kg: parsedKg }
      if (date)  body.harvestedAt = date
      if (notes.trim()) body.notes = notes.trim()

      const res = await fetch(`/api/crops/${cropId}/harvests`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })

      if (!res.ok) { setError('Error al registrar la recogida.'); return }

      setKg(''); setDate(''); setNotes(''); setOpen(false)
      router.refresh()
    } catch {
      setError('Error de conexión.')
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors cursor-pointer"
      >
        <Plus className="size-3.5" />
        Registrar recogida
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-xs text-muted mb-1">Kilos cortados</label>
          <input
            type="number"
            step="0.1"
            min="0.1"
            value={kg}
            onChange={e => setKg(e.target.value)}
            placeholder="12.5"
            required
            className={`${inputClass} w-full`}
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-muted mb-1">Fecha</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className={`${inputClass} w-full`}
          />
        </div>
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">Notas — opcional</label>
        <input
          type="text"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Calidad excelente…"
          className={`${inputClass} w-full`}
        />
      </div>
      {error ? <p className="text-xs text-danger-text">{error}</p> : null}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="px-3 py-1.5 text-xs font-medium bg-primary text-white rounded-md hover:bg-primary-hover transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
        >
          {loading ? 'Guardando…' : 'Guardar'}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setError(null) }}
          className="px-3 py-1.5 text-xs font-medium border border-border text-muted rounded-md hover:text-foreground transition-colors cursor-pointer"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
