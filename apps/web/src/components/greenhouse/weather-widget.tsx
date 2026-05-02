type WeatherWidgetProps = {
  temperature: number
  humidity:    number
  wind:        number
}

export const WeatherWidget = ({ temperature, humidity, wind }: WeatherWidgetProps) => (
  <div className="flex gap-4 text-sm text-foreground">
    <span className="flex items-center gap-1.5">
      <span className="text-base leading-none">🌡️</span>
      <span className="font-medium">{temperature.toFixed(1)}°C</span>
    </span>
    <span className="flex items-center gap-1.5">
      <span className="text-base leading-none">💧</span>
      <span className="font-medium">{humidity}%</span>
    </span>
    <span className="flex items-center gap-1.5">
      <span className="text-base leading-none">💨</span>
      <span className="font-medium">{wind} km/h</span>
    </span>
  </div>
)
