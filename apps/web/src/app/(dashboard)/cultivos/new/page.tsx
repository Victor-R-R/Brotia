'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CROP_EMOJI, CROP_NAMES, getCropEmoji, matchesCropSearch } from '@/lib/crops'

type GreenhouseOption = { id: string; name: string }

const inputClass =
  'w-full bg-surface border border-border rounded-md px-3 py-2.5 text-sm text-foreground placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary'

const NewCropPage = () => {
  const router = useRouter()
  const [selectedCrop,      setSelectedCrop]      = useState('')
  const [customName,        setCustomName]        = useState('')
  const [dropdownOpen,      setDropdownOpen]      = useState(false)
  const [search,            setSearch]            = useState('')
  const [variety,           setVariety]           = useState('')
  const [plantedAt,         setPlantedAt]         = useState('')
  const [expectedHarvestAt, setExpectedHarvestAt] = useState('')
  const [harvestedAt,       setHarvestedAt]       = useState('')
  const [greenhouseId,      setGreenhouseId]      = useState('')
  const [greenhouses,       setGreenhouses]       = useState<GreenhouseOption[]>([])
  const [loading,           setLoading]           = useState(false)
  const [error,             setError]             = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const cropName = selectedCrop === '__otro' ? customName : selectedCrop

  const filtered = CROP_NAMES.filter(n => matchesCropSearch(n, search))

  // Close dropdown on outside click
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

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/greenhouses')
        if (res.ok) {
          const data = await res.json() as GreenhouseOption[]
          setGreenhouses(data)
          if (data.length > 0) setGreenhouseId(data[0].id)
        }
      } catch { /* silent */ }
    }
    load()
  }, [])

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
    if (!cropName.trim()) { setError('Selecciona o escribe el nombre del cultivo.'); return }
    setError(null)
    setLoading(true)

    try {
      const body: Record<string, unknown> = {
        name: cropName.trim(),
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

      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-lg p-6 flex flex-col gap-5">

        {/* Crop dropdown */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Tipo de cultivo
          </label>
          <div ref={dropdownRef} className="relative">
            {/* Trigger */}
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

            {/* Dropdown panel */}
            {dropdownOpen ? (
              <div className="absolute z-50 top-full mt-1 w-full bg-surface border border-border rounded-lg shadow-md overflow-hidden">
                {/* Search */}
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

                {/* List */}
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

                {/* Otro */}
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

          {/* Custom name input */}
          {selectedCrop === '__otro' ? (
            <input
              type="text"
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              placeholder="Nombre del cultivo…"
              className={`${inputClass} mt-2`}
              autoFocus
            />
          ) : null}
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
