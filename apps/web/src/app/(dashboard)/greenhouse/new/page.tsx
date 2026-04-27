'use client'

import { useState, useCallback } from 'react'
import { useRouter }              from 'next/navigation'
import { MapPin, Layers, X, CheckCircle, Loader } from 'lucide-react'
import { Button }                 from '@/components/ui/button'
import { GreenhouseCreatorMapDynamic } from '@/components/greenhouse/greenhouse-creator-map-dynamic'
import type { Feature } from 'geojson'

const inputClass =
  'w-full bg-surface border border-border rounded-md px-3 py-2.5 text-sm text-foreground ' +
  'placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary'

type CatastroResult = {
  found:    boolean
  rc?:      string
  address?: string
  area?:    number | null
  polygon?: Feature | null
}

const NewGreenhousePage = () => {
  const router = useRouter()

  const [name,         setName]         = useState('')
  const [area,         setArea]         = useState('')
  const [pickedLat,    setPickedLat]    = useState<number | null>(null)
  const [pickedLng,    setPickedLng]    = useState<number | null>(null)
  const [showCatastro, setShowCatastro] = useState(false)
  const [parcelGeo,    setParcelGeo]    = useState<Feature | null>(null)
  const [catastro,     setCatastro]     = useState<CatastroResult | null>(null)
  const [querying,     setQuerying]     = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState<string | null>(null)

  const handlePick = useCallback(async (lat: number, lng: number) => {
    setPickedLat(lat)
    setPickedLng(lng)
    setCatastro(null)
    setParcelGeo(null)
    setQuerying(true)

    try {
      const res  = await fetch(`/api/catastro?lat=${lat}&lng=${lng}`)
      const data = await res.json() as CatastroResult

      setCatastro(data)

      if (data.found) {
        if (data.polygon) setParcelGeo(data.polygon)
        if (data.area && area === '') setArea(String(Math.round(data.area)))
      }
    } catch {
      // Non-critical — user can fill in area manually
    } finally {
      setQuerying(false)
    }
  }, [area])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (pickedLat === null || pickedLng === null) {
      setError('Haz clic en el mapa para ubicar tu invernadero.')
      return
    }

    if (area.trim() !== '') {
      const parsed = parseFloat(area)
      if (isNaN(parsed) || parsed <= 0) {
        setError('Superficie no válida.')
        return
      }
    }

    setLoading(true)
    try {
      const body: Record<string, unknown> = { name, lat: pickedLat, lng: pickedLng }
      if (area.trim()) body.area = parseFloat(area)

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

      const gh = await res.json()
      router.push(`/greenhouse/${gh.id}`)
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full -m-4 md:-m-6">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-border bg-surface flex-shrink-0">
        <div>
          <h1 className="font-heading text-lg font-bold text-foreground">Nuevo invernadero</h1>
          <p className="text-xs text-subtle mt-0.5">
            {pickedLat === null
              ? 'Haz clic en el mapa para ubicar tu invernadero'
              : `${pickedLat.toFixed(5)}, ${pickedLng!.toFixed(5)}`
            }
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.back()}
          className="p-1.5 rounded-md text-subtle hover:text-foreground hover:bg-surface-alt transition-colors"
          aria-label="Cancelar"
        >
          <X size={18} />
        </button>
      </div>

      {/* Body: form panel + map */}
      <div className="flex flex-col-reverse lg:flex-row flex-1 min-h-0">

        {/* ── Left panel (form) ── */}
        <aside className="w-full lg:w-72 flex-shrink-0 bg-surface border-t lg:border-t-0 lg:border-r border-border flex flex-col overflow-y-auto">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4 flex-1">

            {/* Catastro toggle */}
            <button
              type="button"
              onClick={() => setShowCatastro(v => !v)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
                showCatastro
                  ? 'bg-primary/10 border-primary/30 text-primary'
                  : 'bg-surface-alt border-border text-muted hover:text-foreground'
              }`}
            >
              <Layers size={15} />
              Overlay Catastro
              <span className={`ml-auto text-xs px-1.5 py-0.5 rounded ${showCatastro ? 'bg-primary text-white' : 'bg-border text-subtle'}`}>
                {showCatastro ? 'ON' : 'OFF'}
              </span>
            </button>

            {/* Catastro result */}
            {querying && (
              <div className="flex items-center gap-2 text-xs text-muted">
                <Loader size={13} className="animate-spin" />
                Consultando Catastro…
              </div>
            )}
            {!querying && catastro?.found && (
              <div className="bg-primary/8 border border-primary/20 rounded-md p-3 text-xs text-foreground">
                <div className="flex items-center gap-1.5 mb-1.5 text-primary font-medium">
                  <CheckCircle size={13} />
                  Parcela encontrada
                </div>
                <p className="text-subtle leading-relaxed">{catastro.address}</p>
                <p className="mt-1 font-mono text-subtle">RC: {catastro.rc}</p>
              </div>
            )}
            {!querying && catastro?.found === false && pickedLat !== null && (
              <p className="text-xs text-subtle">Sin parcela catastral en este punto.</p>
            )}

            {/* Name */}
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

            {/* Area */}
            <div>
              <label htmlFor="area" className="block text-sm font-medium text-foreground mb-1.5">
                Superficie (m²)
                <span className="text-subtle font-normal ml-1">— opcional</span>
                {catastro?.area ? (
                  <span className="ml-1 text-xs text-primary font-normal">(Catastro)</span>
                ) : null}
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

            {/* Location display */}
            {pickedLat !== null && (
              <div className="bg-surface-alt rounded-md px-3 py-2.5 text-xs text-muted">
                <div className="flex items-center gap-1.5 mb-1 text-foreground font-medium">
                  <MapPin size={12} />
                  Ubicación seleccionada
                </div>
                <span className="font-mono">{pickedLat.toFixed(6)}, {pickedLng!.toFixed(6)}</span>
              </div>
            )}

            {error ? (
              <div className="text-sm text-danger-text bg-danger rounded-md px-3 py-2">
                {error}
              </div>
            ) : null}

            <div className="mt-auto pt-2">
              <Button
                type="submit"
                loading={loading}
                className="w-full"
              >
                Crear invernadero
              </Button>
            </div>
          </form>
        </aside>

        {/* ── Map ── */}
        <div className="flex-1 min-h-72 lg:min-h-0 relative">
          <GreenhouseCreatorMapDynamic
            pickedLat={pickedLat}
            pickedLng={pickedLng}
            showCatastro={showCatastro}
            parcelGeo={parcelGeo}
            onPick={handlePick}
          />

          {/* Hint overlay when no location picked */}
          {pickedLat === null && (
            <div className="absolute inset-0 flex items-end justify-center pb-8 pointer-events-none">
              <div className="bg-surface/90 backdrop-blur-sm border border-border rounded-xl px-4 py-2.5 text-sm text-foreground shadow-md">
                Haz clic en el mapa para ubicar tu invernadero
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default NewGreenhousePage
