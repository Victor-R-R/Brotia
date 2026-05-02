'use client'

import { useRef, useEffect, memo } from 'react'
import 'maplibre-gl/dist/maplibre-gl.css'

export type Marker = {
  id:   string
  name: string
  lat:  number
  lng:  number
}

type GreenhouseMapProps = {
  markers:   Marker[]
  onSelect?: (id: string) => void
}

export const GreenhouseMap = memo(({ markers, onSelect }: GreenhouseMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    let cancelled = false
    let map: import('maplibre-gl').Map | null = null

    const init = async () => {
      const maplibre = await import('maplibre-gl')

      if (cancelled) return

      map = new maplibre.Map({
        container: containerRef.current!,
        style:     'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
        center:    markers.length > 0 ? [markers[0].lng, markers[0].lat] : [-3.7038, 40.4168],
        zoom:      7,
      })

      map.on('load', () => {
        markers.forEach(marker => {
          if (!map) return
          const el = document.createElement('div')
          el.className = 'size-4 bg-primary rounded-full border-2 border-surface shadow-md cursor-pointer'

          new maplibre.Marker({ element: el })
            .setLngLat([marker.lng, marker.lat])
            .setPopup(new maplibre.Popup().setText(marker.name))
            .addTo(map)

          el.addEventListener('click', () => onSelect?.(marker.id))
        })
      })
    }

    init()

    return () => {
      cancelled = true
      map?.remove()
    }
  }, [markers, onSelect])

  return <div ref={containerRef} className="w-full h-full rounded-lg overflow-hidden" />
})

GreenhouseMap.displayName = 'GreenhouseMap'
