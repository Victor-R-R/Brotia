'use client'

import { useRef, useEffect, memo } from 'react'

type Marker = {
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

    let map: import('maplibre-gl').Map | null = null

    const init = async () => {
      const maplibre = await import('maplibre-gl')
      await import('maplibre-gl/dist/maplibre-gl.css')

      map = new maplibre.Map({
        container: containerRef.current!,
        style:     'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
        center:    markers.length > 0 ? [markers[0].lng, markers[0].lat] : [-3.7038, 40.4168],
        zoom:      7,
      })

      map.on('load', () => {
        markers.forEach(marker => {
          if (!map) return
          const el = document.createElement('div')
          el.className = 'w-4 h-4 bg-primary rounded-full border-2 border-white shadow-md cursor-pointer'

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
      map?.remove()
    }
  }, [markers, onSelect])

  return <div ref={containerRef} className="w-full h-full rounded-lg overflow-hidden" />
})

GreenhouseMap.displayName = 'GreenhouseMap'
