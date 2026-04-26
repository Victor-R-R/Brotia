import { describe, it, expect, vi } from 'vitest'

vi.mock('@brotia/db', () => ({
  db: {
    greenhouse:   { findMany: vi.fn() },
    weatherAlert: { create: vi.fn() },
  },
}))

vi.mock('@/lib/weather', () => ({
  getWeather:  vi.fn(),
  checkAlerts: vi.fn(),
}))

import { db } from '@brotia/db'
import { getWeather, checkAlerts } from '@/lib/weather'
import { POST } from '../app/api/alerts/check/route'

describe('POST /api/alerts/check', () => {
  it('creates alerts for all greenhouses with issues', async () => {
    vi.mocked(db.greenhouse.findMany).mockResolvedValue([
      { id: 'gh-1', lat: 37.5, lng: -5.9 },
    ] as any)

    vi.mocked(getWeather).mockResolvedValue({} as any)

    vi.mocked(checkAlerts).mockReturnValue([
      { type: 'FROST', message: 'Helada detectada', severity: 'high' },
    ])

    vi.mocked(db.weatherAlert.create).mockResolvedValue({} as any)

    const req = new Request('http://localhost/api/alerts/check', {
      method: 'POST',
      headers: { Authorization: `Bearer test-secret` },
    })

    // Set CRON_SECRET so the auth check passes
    process.env.CRON_SECRET = 'test-secret'

    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.created).toBe(1)
    expect(db.weatherAlert.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ type: 'FROST' }) })
    )
  })

  it('returns 401 when CRON_SECRET is wrong', async () => {
    process.env.CRON_SECRET = 'correct-secret'
    const req = new Request('http://localhost/api/alerts/check', {
      method: 'POST',
      headers: { Authorization: 'Bearer wrong-secret' },
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })
})
