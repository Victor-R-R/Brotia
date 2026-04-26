import { describe, it, expect } from 'vitest'
import { checkAlerts } from '../lib/weather'
import type { WeatherResponse } from '@brotia/api'

const mockWeather: WeatherResponse = {
  current: {
    temperature_2m:       1.5,
    relative_humidity_2m: 88,
    wind_speed_10m:       12,
    precipitation:        0,
  },
  hourly: {
    time:                      ['2026-04-26T00:00', '2026-04-26T01:00'],
    temperature_2m:            [1.5, 1.2],
    precipitation_probability: [10, 15],
    showers_sum:               [0, 0],
  },
}

describe('checkAlerts', () => {
  it('detects FROST when temperature < 2°C', () => {
    const alerts = checkAlerts(mockWeather)
    const types = alerts.map(a => a.type)
    expect(types).toContain('FROST')
  })

  it('detects HIGH_HUMIDITY when humidity > 90%', () => {
    const highHumidity = {
      ...mockWeather,
      current: { ...mockWeather.current, relative_humidity_2m: 92 },
    }
    const alerts = checkAlerts(highHumidity)
    const types = alerts.map(a => a.type)
    expect(types).toContain('HIGH_HUMIDITY')
  })

  it('detects STRONG_WIND when wind > 60 km/h', () => {
    const strongWind = {
      ...mockWeather,
      current: { ...mockWeather.current, wind_speed_10m: 65 },
    }
    const alerts = checkAlerts(strongWind)
    const types = alerts.map(a => a.type)
    expect(types).toContain('STRONG_WIND')
  })

  it('returns no alerts when conditions are normal', () => {
    const normal: WeatherResponse = {
      current: { temperature_2m: 22, relative_humidity_2m: 65, wind_speed_10m: 15, precipitation: 0 },
      hourly:  { time: [], temperature_2m: [], precipitation_probability: [20], showers_sum: [0] },
    }
    const alerts = checkAlerts(normal)
    expect(alerts).toHaveLength(0)
  })
})
