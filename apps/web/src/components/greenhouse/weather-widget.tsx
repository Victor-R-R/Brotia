import { Thermometer, Droplets, Wind } from 'lucide-react'

type WeatherWidgetProps = {
  temperature: number
  humidity:    number
  wind:        number
}

export const WeatherWidget = ({ temperature, humidity, wind }: WeatherWidgetProps) => (
  <div className="flex gap-4 text-sm text-muted">
    <span className="flex items-center gap-1">
      <Thermometer className="size-4 text-primary" />
      {temperature.toFixed(1)}°C
    </span>
    <span className="flex items-center gap-1">
      <Droplets className="size-4 text-primary" />
      {humidity}%
    </span>
    <span className="flex items-center gap-1">
      <Wind className="size-4 text-primary" />
      {wind} km/h
    </span>
  </div>
)
