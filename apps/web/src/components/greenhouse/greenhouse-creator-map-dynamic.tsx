'use client'

import dynamic from 'next/dynamic'
import type { Feature } from 'geojson'

const Inner = dynamic(
  () => import('./greenhouse-creator-map').then(m => m.GreenhouseCreatorMap),
  { ssr: false }
)

type Props = {
  pickedLat:    number | null
  pickedLng:    number | null
  showCatastro: boolean
  parcelGeo:    Feature | null
  onPick:       (lat: number, lng: number) => void
}

export const GreenhouseCreatorMapDynamic = (props: Props) => <Inner {...props} />
