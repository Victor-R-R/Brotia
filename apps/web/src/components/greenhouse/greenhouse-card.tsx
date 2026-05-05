import Link from 'next/link'
import { getCropEmoji } from '@/lib/crops'
import { WeatherWidget } from './weather-widget'

type GreenhouseCardProps = {
  id:              string
  name:            string
  lat:             number
  lng:             number
  area?:           number | null
  temperature?:    number
  humidity?:       number
  wind?:           number
  activeCropName?: string | null
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
  activeCropName,
}: GreenhouseCardProps) => (
  <Link href={`/greenhouse/${id}`} className="block group">
    <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-primary/40 transition-all">

      <div className="p-4">
        {/* Title + area badge */}
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-heading text-base font-semibold text-foreground flex items-center gap-2">
            🏡 {name}
          </h3>
          {area ? (
            <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full flex items-center gap-1">
              📐 {area.toLocaleString()} m²
            </span>
          ) : null}
        </div>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-xs text-subtle mb-2">
          <span className="text-sm leading-none">📍</span>
          <span>{lat.toFixed(4)}, {lng.toFixed(4)}</span>
        </div>

        {/* Active crop */}
        {activeCropName ? (
          <div className="flex items-center gap-1.5 text-xs text-muted mb-3">
            <span className="text-sm leading-none">{getCropEmoji(activeCropName)}</span>
            <span>{activeCropName}</span>
          </div>
        ) : (
          <div className="mb-3" />
        )}

        {/* Weather */}
        {temperature !== undefined && humidity !== undefined && wind !== undefined ? (
          <div className="pt-3 border-t border-border-subtle">
            <WeatherWidget temperature={temperature} humidity={humidity} wind={wind} />
          </div>
        ) : (
          <p className="text-xs text-subtle pt-3 border-t border-border-subtle">🌤️ Clima no disponible</p>
        )}
      </div>
    </div>
  </Link>
)
