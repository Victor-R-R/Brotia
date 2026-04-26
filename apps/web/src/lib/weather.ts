import type { WeatherResponse, AlertCheckResult } from '@brotia/api'

const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast'

const FROST_THRESHOLD           = 2    // °C
const FROST_HIGH_SEVERITY       = 0    // °C
const WIND_THRESHOLD            = 60   // km/h
const WIND_HIGH_SEVERITY        = 90   // km/h
const HUMIDITY_THRESHOLD        = 90   // %
const RAIN_PROB_THRESHOLD       = 80   // %
const HAIL_PROB_THRESHOLD       = 70   // %
const ALERT_HORIZON_HOURS       = 12   // how many hourly slots to scan for precip alerts

export const getWeather = async (lat: number, lng: number): Promise<WeatherResponse> => {
  const url = new URL(OPEN_METEO_URL)
  url.searchParams.set('latitude',      lat.toString())
  url.searchParams.set('longitude',     lng.toString())
  url.searchParams.set('current',       'temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation')
  url.searchParams.set('hourly',        'temperature_2m,precipitation_probability,showers_sum')
  url.searchParams.set('forecast_days', '7')
  url.searchParams.set('timezone',      'auto')

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } })

  if (!res.ok) {
    throw new Error(`Open-Meteo error: ${res.status}`)
  }

  return res.json() as Promise<WeatherResponse>
}

export const checkAlerts = (weather: WeatherResponse): AlertCheckResult[] => {
  const alerts: AlertCheckResult[] = []
  const { current, hourly } = weather

  if (current.temperature_2m < FROST_THRESHOLD) {
    alerts.push({
      type:     'FROST',
      message:  `Temperatura de ${current.temperature_2m}°C — riesgo de helada`,
      severity: current.temperature_2m < FROST_HIGH_SEVERITY ? 'high' : 'medium',
    })
  }

  if (current.wind_speed_10m > WIND_THRESHOLD) {
    alerts.push({
      type:     'STRONG_WIND',
      message:  `Viento de ${current.wind_speed_10m} km/h — viento fuerte`,
      severity: current.wind_speed_10m > WIND_HIGH_SEVERITY ? 'high' : 'medium',
    })
  }

  if (current.relative_humidity_2m > HUMIDITY_THRESHOLD) {
    alerts.push({
      type:     'HIGH_HUMIDITY',
      message:  `Humedad del ${current.relative_humidity_2m}% — riesgo de hongos`,
      severity: 'low',
    })
  }

  const precipProbs = (hourly.precipitation_probability ?? []).slice(0, ALERT_HORIZON_HOURS)
  const showers     = (hourly.showers_sum ?? []).slice(0, ALERT_HORIZON_HOURS)

  const maxPrecipProb = precipProbs.length > 0 ? Math.max(...precipProbs) : 0
  const hasShowers    = showers.some(v => v > 0)

  if (maxPrecipProb > RAIN_PROB_THRESHOLD) {
    alerts.push({
      type:     'RAIN_EXPECTED',
      message:  `${maxPrecipProb}% probabilidad de lluvia en las próximas ${ALERT_HORIZON_HOURS} horas`,
      severity: 'low',
    })
  }

  if (maxPrecipProb > HAIL_PROB_THRESHOLD && hasShowers) {
    alerts.push({
      type:     'HAIL',
      message:  'Lluvia convectiva detectada — posible granizo',
      severity: 'high',
    })
  }

  return alerts
}
