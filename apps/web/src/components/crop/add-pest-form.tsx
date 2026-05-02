'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'

const inputClass =
  'bg-surface border border-border rounded-md px-3 py-2 text-sm text-foreground ' +
  'placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary'

export const AddPestForm = ({ cropId }: { cropId: string }) => {
  const router      = useRouter()
  const [open,      setOpen]      = useState(false)
  const [pestName,  setPestName]  = useState('')
  const [severity,  setSeverity]  = useState<'low' | 'medium' | 'high'>('low')
  const [notes,     setNotes]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const body: Record<string, unknown> = { pestName: pestName.trim(), severity }
      if (notes.trim()) body.notes = notes.trim()

      const res = await fetch(`/api/crops/${cropId}/pests`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })

      if (!res.ok) { setError('Error al registrar la plaga.'); return }

      setPestName(''); setSeverity('low'); setNotes(''); setOpen(false)
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
        Registrar plaga
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-xs text-muted mb-1">Plaga / enfermedad</label>
          <input
            type="text"
            value={pestName}
            onChange={e => setPestName(e.target.value)}
            placeholder="Pulgón, oídio…"
            required
            className={`${inputClass} w-full`}
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Severidad</label>
          <select
            value={severity}
            onChange={e => setSeverity(e.target.value as 'low' | 'medium' | 'high')}
            className={`${inputClass}`}
          >
            <option value="low">Leve</option>
            <option value="medium">Moderada</option>
            <option value="high">Grave</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">Notas — opcional</label>
        <input
          type="text"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Zona afectada, síntomas…"
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
