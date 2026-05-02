'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, ChevronDown, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CROP_EMOJI, CROP_NAMES, getCropEmoji, matchesCropSearch } from '@/lib/crops'

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

  const [selectedCrop,      setSelectedCrop]      = useState('')
  const [customName,        setCustomName]        = useState('')
  const [dropdownOpen,      setDropdownOpen]      = useState(false)
  const [search,            setSearch]            = useState('')
  const [variety,           setVariety]           = useState('')
  const [status,            setStatus]            = useState<Status>('GROWING')
  const [plantedAt,         setPlantedAt]         = useState('')
  const [expectedHarvestAt, setExpectedHarvestAt] = useState('')
  const [harvestedAt,       setHarvestedAt]       = useState('')
  const [loading,           setLoading]           = useState(false)
  const [fetched,           setFetched]           = useState(false)
  const [error,             setError]             = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const cropName = selectedCrop === '__otro' ? customName : selectedCrop

  const filtered = CROP_NAMES.filter(n => matchesCropSearch(n, search))

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Load existing crop — pre-select in dropdown
  useEffect(() => {
    fetch(`/api/crops/${id}`)
      .then(r => r.json())
      .then(crop => {
        const existingName: string = crop.name ?? ''
        if (CROP_NAMES.includes(existingName)) {
          setSelectedCrop(existingName)
        } else {
          setSelectedCrop('__otro')
          setCustomName(existingName)
        }
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

  const selectCrop = (name: string) => {
    setSelectedCrop(name)
    setDropdownOpen(false)
    setSearch('')
    if (name !== '__otro') setCustomName('')
  }

  const clearCrop = () => {
    setSelectedCrop('')
    setCustomName('')
    setSearch('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cropName.trim()) { setError('El nombre del cultivo es obligatorio.'); return }
    setError(null)
    setLoading(true)

    try {
      const body: Record<string, unknown> = { name: cropName.trim(), status }
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
        className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors mb-6 cursor-pointer"
      >
        <ArrowLeft className="size-4" />
        Volver
      </button>

      <h1 className="font-heading text-2xl font-bold text-foreground mb-6">Editar cultivo</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        {/* Crop dropdown */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Nombre</label>
          <div ref={dropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen(o => !o)}
              className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm rounded-md border transition-colors cursor-pointer text-left
                ${dropdownOpen
                  ? 'border-primary ring-2 ring-primary/40 bg-surface'
                  : 'border-border bg-surface hover:border-primary/50'
                }
                ${selectedCrop && selectedCrop !== '__otro' ? 'text-foreground' : 'text-subtle'}
              `}
            >
              {selectedCrop && selectedCrop !== '__otro' ? (
                <>
                  <span className="text-base leading-none">{getCropEmoji(selectedCrop)}</span>
                  <span className="font-medium text-foreground flex-1">{selectedCrop}</span>
                </>
              ) : selectedCrop === '__otro' ? (
                <>
                  <span className="text-base leading-none">✏️</span>
                  <span className="font-medium text-foreground flex-1">{customName || 'Otro…'}</span>
                </>
              ) : (
                <span className="flex-1">Selecciona un cultivo…</span>
              )}
              <div className="flex items-center gap-1 ml-auto shrink-0">
                {selectedCrop ? (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={e => { e.stopPropagation(); clearCrop() }}
                    onKeyDown={e => e.key === 'Enter' && clearCrop()}
                    className="p-0.5 rounded hover:bg-surface-alt cursor-pointer"
                  >
                    <X className="size-3.5 text-muted" />
                  </span>
                ) : null}
                <ChevronDown className={`size-4 text-muted transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {dropdownOpen ? (
              <div className="absolute z-50 top-full mt-1 w-full bg-surface border border-border rounded-lg shadow-md overflow-hidden">
                <div className="p-2 border-b border-border-subtle">
                  <div className="flex items-center gap-2 px-2 py-1.5 bg-surface-alt rounded-md">
                    <Search className="size-3.5 text-muted shrink-0" />
                    <input
                      type="text"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Buscar cultivo…"
                      autoFocus
                      className="flex-1 bg-transparent text-sm text-foreground placeholder:text-subtle outline-none"
                    />
                  </div>
                </div>

                <ul className="max-h-56 overflow-y-auto py-1">
                  {filtered.length > 0 ? filtered.map(name => (
                    <li key={name}>
                      <button
                        type="button"
                        onClick={() => selectCrop(name)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer transition-colors text-left
                          ${selectedCrop === name
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-foreground hover:bg-surface-alt'
                          }`}
                      >
                        <span className="text-base leading-none">{CROP_EMOJI[name]}</span>
                        {name}
                        {selectedCrop === name ? <span className="ml-auto text-primary">✓</span> : null}
                      </button>
                    </li>
                  )) : (
                    <li className="px-3 py-3 text-sm text-subtle text-center">Sin resultados</li>
                  )}
                </ul>

                <div className="border-t border-border-subtle py-1">
                  <button
                    type="button"
                    onClick={() => selectCrop('__otro')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer transition-colors text-left
                      ${selectedCrop === '__otro'
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted hover:bg-surface-alt hover:text-foreground'
                      }`}
                  >
                    <span className="text-base leading-none">✏️</span>
                    Otro (escribir manualmente)
                    {selectedCrop === '__otro' ? <span className="ml-auto text-primary">✓</span> : null}
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          {selectedCrop === '__otro' ? (
            <input
              type="text"
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              placeholder="Nombre del cultivo…"
              className={`${inputClass} mt-2`}
            />
          ) : null}
        </div>

        <div>
          <label htmlFor="variety" className="block text-sm font-medium text-foreground mb-1.5">
            Variedad
            <span className="text-subtle font-normal ml-1">— opcional</span>
          </label>
          <input
            id="variety" type="text" value={variety}
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
            id="plantedAt" type="date" value={plantedAt} required
            onChange={e => setPlantedAt(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-foreground mb-1.5">Estado</label>
          <select
            id="status" value={status}
            onChange={e => setStatus(e.target.value as Status)}
            className={selectClass}
          >
            <option value="GROWING">🌱 En crecimiento</option>
            <option value="HARVESTED">🌾 Cosechado</option>
            <option value="FAILED">❌ Fallido</option>
          </select>
        </div>

        <div>
          <label htmlFor="harvest" className="block text-sm font-medium text-foreground mb-1.5">
            Cosecha prevista
            <span className="text-subtle font-normal ml-1">— opcional</span>
          </label>
          <input
            id="harvest" type="date" value={expectedHarvestAt}
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
            id="harvestedAt" type="date" value={harvestedAt}
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
