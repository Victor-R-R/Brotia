import { describe, it, expect } from 'vitest'
import { checkAlerts } from '../lib/weather'
import type { WeatherResponse } from '@brotia/api'

const base: WeatherResponse = {
  current: {
    temperature_2m:       20,
    relative_humidity_2m: 60,
    wind_speed_10m:       10,
    precipitation:        0,
  },
  hourly: {
    time:                      ['2026-04-26T00:00', '2026-04-26T01:00'],
    temperature_2m:            [20, 20],
    precipitation_probability: [10, 15],
    showers_sum:               [0, 0],
  },
}

describe('checkAlerts', () => {
  it('detects FROST when temperature < 2°C', () => {
    const weather: WeatherResponse = { ...base, current: { ...base.current, temperature_2m: 1.5 } }
    const types = checkAlerts(weather).map(a => a.type)
    expect(types).toContain('FROST')
  })

  it('detects HIGH_HUMIDITY when humidity > 90%', () => {
    const weather: WeatherResponse = { ...base, current: { ...base.current, relative_humidity_2m: 92 } }
    const types = checkAlerts(weather).map(a => a.type)
    expect(types).toContain('HIGH_HUMIDITY')
  })

  it('detects STRONG_WIND when wind > 60 km/h', () => {
    const weather: WeatherResponse = { ...base, current: { ...base.current, wind_speed_10m: 65 } }
    const types = checkAlerts(weather).map(a => a.type)
    expect(types).toContain('STRONG_WIND')
  })

  it('returns no alerts when conditions are normal', () => {
    expect(checkAlerts(base)).toHaveLength(0)
  })
})
