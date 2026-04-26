export type GreenhouseListItem = {
  id:     string
  name:   string
  lat:    number
  lng:    number
  area:   number | null
  crops:  { name: string }[]
  alerts: { type: string }[]
}

export type WeatherData = {
  weather: {
    current: {
      temperature_2m:       number
      relative_humidity_2m: number
      wind_speed_10m:       number
    }
  }
  alerts: { type: string; message: string }[]
}

export type CreatedGreenhouse = { id: string }

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'

export const api = {
  greenhouses: {
    list: async (): Promise<GreenhouseListItem[]> => {
      const res = await fetch(`${API_BASE}/api/greenhouses`, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to fetch greenhouses')
      return res.json() as Promise<GreenhouseListItem[]>
    },
    get: async (id: string): Promise<GreenhouseListItem> => {
      const res = await fetch(`${API_BASE}/api/greenhouses/${id}`, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to fetch greenhouse')
      return res.json() as Promise<GreenhouseListItem>
    },
    create: async (data: { name: string; lat: number; lng: number; area?: number }): Promise<CreatedGreenhouse> => {
      const res = await fetch(`${API_BASE}/api/greenhouses`, {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify(data),
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed to create greenhouse')
      return res.json() as Promise<CreatedGreenhouse>
    },
    weather: async (id: string): Promise<WeatherData> => {
      const res = await fetch(`${API_BASE}/api/greenhouses/${id}/weather`, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to fetch weather')
      return res.json() as Promise<WeatherData>
    },
  },
}
