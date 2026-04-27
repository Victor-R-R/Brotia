'use client'

import { useState, useRef, useEffect, memo } from 'react'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { Feature } from 'geojson'

type Props = {
  pickedLat:    number | null
  pickedLng:    number | null
  showCatastro: boolean
  parcelGeo:    Feature | null
  onPick:       (lat: number, lng: number) => void
}

export const GreenhouseCreatorMap = memo(({
  pickedLat,
  pickedLng,
  showCatastro,
  parcelGeo,
  onPick,
}: Props) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<import('maplibre-gl').Map | null>(null)
  const markerRef    = useRef<import('maplibre-gl').Marker | null>(null)
  const onPickRef    = useRef(onPick)
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => { onPickRef.current = onPick }, [onPick])

  // Init map once
  useEffect(() => {
    if (!containerRef.current) return
    let cancelled = false

    const init = async () => {
      const ml = await import('maplibre-gl')
      if (cancelled || !containerRef.current) return

      const map = new ml.Map({
        container: containerRef.current,
        style:     'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
        center:    [-3.7038, 38.5],
        zoom:      6,
      })
      mapRef.current = map

      map.on('load', () => {
        if (cancelled) return

        // Catastro WMS overlay — source added lazily on first activation to avoid rate-limiting

        // Parcel polygon (fill + border)
        map.addSource('parcel', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        })
        map.addLayer({
          id:     'parcel-fill',
          type:   'fill',
          source: 'parcel',
          paint:  { 'fill-color': '#2D5A1B', 'fill-opacity': 0.2 },
        })
        map.addLayer({
          id:     'parcel-border',
          type:   'line',
          source: 'parcel',
          paint:  { 'line-color': '#2D5A1B', 'line-width': 2.5 },
        })

        map.on('click', (e) => {
          onPickRef.current(e.lngLat.lat, e.lngLat.lng)
        })
        map.getCanvas().style.cursor = 'crosshair'

        setMapReady(true)
      })
    }

    init()

    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current  = null
      markerRef.current = null
    }
  }, [])

  // Toggle catastro layer — lazy-init source on first activation
  useEffect(() => {
    const map = mapRef.current
    if (!mapReady || !map) return

    if (showCatastro) {
      if (map.getZoom() < 14) map.easeTo({ zoom: 16 })
      if (!map.getSource('catastro')) {
        map.addSource('catastro', {
          type:     'raster',
          tiles:    [
            '/api/catastro-wms?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap' +
            '&FORMAT=image/png&TRANSPARENT=true&LAYERS=Catastro&SRS=EPSG:3857' +
            '&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256',
          ],
          tileSize: 256,
        })
        map.addLayer({
          id:      'catastro-layer',
          type:    'raster',
          source:  'catastro',
          minzoom: 14,
          paint:   { 'raster-opacity': 0.65 },
        })
      } else {
        map.setLayoutProperty('catastro-layer', 'visibility', 'visible')
      }
    } else {
      if (map.getLayer('catastro-layer')) {
        map.setLayoutProperty('catastro-layer', 'visibility', 'none')
      }
    }
  }, [mapReady, showCatastro])

  // Update marker position
  useEffect(() => {
    const map = mapRef.current
    if (!mapReady || !map || pickedLat === null || pickedLng === null) return

    const update = async () => {
      const ml = await import('maplibre-gl')
      const m  = mapRef.current
      if (!m) return

      if (markerRef.current) {
        markerRef.current.setLngLat([pickedLng, pickedLat])
      } else {
        const el = document.createElement('div')
        el.style.cssText =
          'width:22px;height:22px;background:#2D5A1B;border:3px solid white;' +
          'border-radius:50%;box-shadow:0 2px 10px rgba(0,0,0,0.35);cursor:pointer'
        markerRef.current = new ml.Marker({ element: el })
          .setLngLat([pickedLng, pickedLat])
          .addTo(m)
      }

      m.easeTo({ center: [pickedLng, pickedLat], zoom: Math.max(m.getZoom(), 16) })
    }

    update()
  }, [mapReady, pickedLat, pickedLng])

  // Update parcel polygon
  useEffect(() => {
    const map = mapRef.current
    if (!mapReady || !map) return
    const src = map.getSource('parcel') as import('maplibre-gl').GeoJSONSource | undefined
    if (!src) return
    src.setData(
      parcelGeo
        ? { type: 'FeatureCollection', features: [parcelGeo] }
        : { type: 'FeatureCollection', features: [] }
    )
  }, [mapReady, parcelGeo])

  return <div ref={containerRef} className="w-full h-full" />
})

GreenhouseCreatorMap.displayName = 'GreenhouseCreatorMap'
