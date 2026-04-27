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

export type CropListItem = {
  id:                string
  name:              string
  variety:           string | null
  plantedAt:         string
  expectedHarvestAt: string | null
  status:            'GROWING' | 'HARVESTED' | 'FAILED'
  greenhouse:        { id: string; name: string }
}

export type UserProfile = {
  id:       string
  email:    string
  name:     string | null
  lastName: string | null
  phone:    string | null
  address:  string | null
  provider: string | null
}

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

  user: {
    get: async (): Promise<UserProfile> => {
      const res = await fetch(`${API_BASE}/api/user`, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to fetch user')
      return res.json() as Promise<UserProfile>
    },
    update: async (data: { name?: string; lastName?: string; phone?: string; address?: string }): Promise<UserProfile> => {
      const res = await fetch(`${API_BASE}/api/user`, {
        method:      'PUT',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify(data),
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed to update user')
      return res.json() as Promise<UserProfile>
    },
    delete: async (): Promise<void> => {
      const res = await fetch(`${API_BASE}/api/user`, {
        method:      'DELETE',
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed to delete account')
    },
  },

  crops: {
    list: async (): Promise<CropListItem[]> => {
      const res = await fetch(`${API_BASE}/api/crops`, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to fetch crops')
      return res.json() as Promise<CropListItem[]>
    },
    create: async (data: {
      name:              string
      variety?:          string
      plantedAt:         string
      expectedHarvestAt?: string
      greenhouseId:      string
    }): Promise<{ id: string }> => {
      const res = await fetch(`${API_BASE}/api/crops`, {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify(data),
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed to create crop')
      return res.json() as Promise<{ id: string }>
    },
  },
}
