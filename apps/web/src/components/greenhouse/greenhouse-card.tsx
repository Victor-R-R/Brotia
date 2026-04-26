import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { WeatherWidget } from './weather-widget'

type GreenhouseCardProps = {
  id:          string
  name:        string
  lat:         number
  lng:         number
  area?:       number | null
  temperature?: number
  humidity?:   number
  wind?:       number
}

export const GreenhouseCard = ({
  id,
  name,
  lat,
  lng,
  area,
  temperature,
  humidity,
  wind,
}: GreenhouseCardProps) => (
  <Link href={`/greenhouse/${id}`} className="block hover:opacity-90 transition-opacity">
    <Card>
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-heading text-base font-semibold text-foreground">{name}</h3>
        {area ? (
          <span className="text-xs text-subtle bg-surface-alt px-2 py-0.5 rounded-md">
            {area} m²
          </span>
        ) : null}
      </div>

      <div className="flex items-center gap-1 text-xs text-subtle mb-3">
        <MapPin className="size-3" />
        {lat.toFixed(4)}, {lng.toFixed(4)}
      </div>

      {temperature !== undefined && humidity !== undefined && wind !== undefined ? (
        <WeatherWidget temperature={temperature} humidity={humidity} wind={wind} />
      ) : (
        <p className="text-xs text-subtle">Cargando clima…</p>
      )}
    </Card>
  </Link>
)
