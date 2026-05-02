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

export type ForumUser = {
  name:     string | null
  lastName: string | null
  avatar:   string | null
}

export type ThreadSummary = {
  id:             string
  title:          string
  category:       string
  contentPreview: string
  images:         string[]
  createdAt:      string
  userId:         string
  user:           ForumUser
  _count:         { replies: number; likes: number }
  hasLiked:       boolean
}

export type ReplyItem = {
  id:        string
  content:   string
  images:    string[]
  createdAt: string
  userId:    string
  user:      ForumUser
  _count:    { likes: number }
  hasLiked:  boolean
}

export type ThreadDetail = Omit<ThreadSummary, 'contentPreview'> & {
  content: string
  replies: ReplyItem[]
}

export type LikeResult = { liked: boolean; count: number }

export type EstadisticasData = {
  greenhouseCount:     number
  cropCounts:          { GROWING: number; HARVESTED: number; FAILED: number }
  harvestTotalKg:      number
  harvestLast30DaysKg: number
  alertCounts:         Record<string, number>
  pestCount:           number
  recentHarvests: {
    cropName:       string
    greenhouseName: string
    kg:             number
    harvestedAt:    string
  }[]
}

import { getToken } from '@/lib/auth-storage'

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'

const apiFetch = async (path: string, init: RequestInit = {}): Promise<Response> => {
  const token = await getToken()
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
  if (init.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }
  return fetch(`${API_BASE}${path}`, { ...init, headers, credentials: 'include' })
}

export const api = {
  greenhouses: {
    list: async (): Promise<GreenhouseListItem[]> => {
      const res = await apiFetch('/api/greenhouses')
      if (!res.ok) throw new Error('Failed to fetch greenhouses')
      return res.json() as Promise<GreenhouseListItem[]>
    },
    get: async (id: string): Promise<GreenhouseListItem> => {
      const res = await apiFetch(`/api/greenhouses/${id}`)
      if (!res.ok) throw new Error('Failed to fetch greenhouse')
      return res.json() as Promise<GreenhouseListItem>
    },
    create: async (data: { name: string; lat: number; lng: number; area?: number }): Promise<CreatedGreenhouse> => {
      const res = await apiFetch('/api/greenhouses', { method: 'POST', body: JSON.stringify(data) })
      if (!res.ok) throw new Error('Failed to create greenhouse')
      return res.json() as Promise<CreatedGreenhouse>
    },
    weather: async (id: string): Promise<WeatherData> => {
      const res = await apiFetch(`/api/greenhouses/${id}/weather`)
      if (!res.ok) throw new Error('Failed to fetch weather')
      return res.json() as Promise<WeatherData>
    },
  },

  user: {
    get: async (): Promise<UserProfile> => {
      const res = await apiFetch('/api/user')
      if (!res.ok) throw new Error('Failed to fetch user')
      return res.json() as Promise<UserProfile>
    },
    update: async (data: { name?: string; lastName?: string; phone?: string; address?: string }): Promise<UserProfile> => {
      const res = await apiFetch('/api/user', { method: 'PUT', body: JSON.stringify(data) })
      if (!res.ok) throw new Error('Failed to update user')
      return res.json() as Promise<UserProfile>
    },
    delete: async (): Promise<void> => {
      const res = await apiFetch('/api/user', { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete account')
    },
  },

  crops: {
    list: async (): Promise<CropListItem[]> => {
      const res = await apiFetch('/api/crops')
      if (!res.ok) throw new Error('Failed to fetch crops')
      return res.json() as Promise<CropListItem[]>
    },
    create: async (data: {
      name:               string
      variety?:           string
      plantedAt:          string
      expectedHarvestAt?: string
      greenhouseId:       string
    }): Promise<{ id: string }> => {
      const res = await apiFetch('/api/crops', { method: 'POST', body: JSON.stringify(data) })
      if (!res.ok) throw new Error('Failed to create crop')
      return res.json() as Promise<{ id: string }>
    },
    delete: async (id: string): Promise<void> => {
      const res = await apiFetch(`/api/crops/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete crop')
    },
  },

  estadisticas: {
    get: async (): Promise<EstadisticasData> => {
      const res = await apiFetch('/api/estadisticas')
      if (!res.ok) throw new Error('Failed to fetch estadisticas')
      return res.json() as Promise<EstadisticasData>
    },
  },

  community: {
    list: async (category?: string, page = 1): Promise<ThreadSummary[]> => {
      const params = new URLSearchParams({ page: String(page) })
      if (category) params.set('category', category)
      const res = await apiFetch(`/api/community?${params}`)
      if (!res.ok) throw new Error('Failed to fetch threads')
      return res.json() as Promise<ThreadSummary[]>
    },
    get: async (id: string): Promise<ThreadDetail> => {
      const res = await apiFetch(`/api/community/${id}`)
      if (!res.ok) throw new Error('Failed to fetch thread')
      return res.json() as Promise<ThreadDetail>
    },
    create: async (data: { title: string; content: string; category: string; images: string[] }): Promise<ThreadDetail> => {
      const res = await apiFetch('/api/community', { method: 'POST', body: JSON.stringify(data) })
      if (!res.ok) throw new Error('Failed to create thread')
      return res.json() as Promise<ThreadDetail>
    },
    reply: async (threadId: string, data: { content: string; images: string[] }): Promise<ReplyItem> => {
      const res = await apiFetch(`/api/community/${threadId}/replies`, { method: 'POST', body: JSON.stringify(data) })
      if (!res.ok) throw new Error('Failed to add reply')
      return res.json() as Promise<ReplyItem>
    },
    likeThread: async (threadId: string): Promise<LikeResult> => {
      const res = await apiFetch(`/api/community/${threadId}/like`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to like thread')
      return res.json() as Promise<LikeResult>
    },
    likeReply: async (replyId: string): Promise<LikeResult> => {
      const res = await apiFetch(`/api/community/replies/${replyId}/like`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to like reply')
      return res.json() as Promise<LikeResult>
    },
    deleteThread: async (id: string): Promise<void> => {
      const res = await apiFetch(`/api/community/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete thread')
    },
    deleteReply: async (id: string): Promise<void> => {
      const res = await apiFetch(`/api/community/replies/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete reply')
    },
  },
}
