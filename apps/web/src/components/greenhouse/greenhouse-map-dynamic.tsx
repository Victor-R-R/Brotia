'use client'

import dynamic from 'next/dynamic'
import type { Marker } from './greenhouse-map'

const GreenhouseMapInner = dynamic(
  () => import('./greenhouse-map').then(m => m.GreenhouseMap),
  { ssr: false }
)

export const GreenhouseMapDynamic = ({ markers, onSelect }: {
  markers: Marker[]
  onSelect?: (id: string) => void
}) => <GreenhouseMapInner markers={markers} onSelect={onSelect} />
