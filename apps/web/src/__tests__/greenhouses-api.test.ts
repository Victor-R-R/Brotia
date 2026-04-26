import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@brotia/db', () => ({
  db: {
    greenhouse: {
      findMany:  vi.fn(),
      create:    vi.fn(),
      findFirst: vi.fn(),
      update:    vi.fn(),
      delete:    vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth', () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: 'user-1', email: 'farmer@test.com' } }),
}))

import { db } from '@brotia/db'
import { GET, POST } from '../app/api/greenhouses/route'

describe('GET /api/greenhouses', () => {
  it('returns greenhouses for authenticated user', async () => {
    vi.mocked(db.greenhouse.findMany).mockResolvedValue([
      { id: 'gh-1', name: 'Invernadero Norte', lat: 37.5, lng: -5.9, area: 200, userId: 'user-1', createdAt: new Date() },
    ] as any)

    const req = new Request('http://localhost/api/greenhouses')
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toHaveLength(1)
    expect(body[0].name).toBe('Invernadero Norte')
  })
})

describe('POST /api/greenhouses', () => {
  it('creates a greenhouse with valid data', async () => {
    const payload = { name: 'Invernadero Sur', lat: 37.4, lng: -5.8, area: 150 }

    vi.mocked(db.greenhouse.create).mockResolvedValue({
      id: 'gh-2', ...payload, userId: 'user-1', createdAt: new Date(),
    } as any)

    const req = new Request('http://localhost/api/greenhouses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.name).toBe('Invernadero Sur')
  })

  it('returns 400 for missing name', async () => {
    const req = new Request('http://localhost/api/greenhouses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat: 37.4, lng: -5.8 }),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
