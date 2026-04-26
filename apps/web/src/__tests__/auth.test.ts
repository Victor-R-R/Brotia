import { describe, it, expect, vi } from 'vitest'

vi.mock('@brotia/db', () => ({
  db: { $connect: vi.fn(), $disconnect: vi.fn() },
}))

vi.mock('@auth/prisma-adapter', () => ({
  PrismaAdapter: vi.fn().mockReturnValue({}),
}))

vi.mock('next-auth', () => ({
  default: vi.fn((config: any) => ({
    handlers: { GET: vi.fn(), POST: vi.fn() },
    auth: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
  })),
}))

import { authConfig } from '@/lib/auth'

describe('authConfig', () => {
  it('has Google provider configured', () => {
    const providerIds = authConfig.providers.map((p: any) => (p as any).id)
    expect(providerIds).toContain('google')
  })

  it('has Apple provider configured', () => {
    const providerIds = authConfig.providers.map((p: any) => (p as any).id)
    expect(providerIds).toContain('apple')
  })

  it('has Resend provider configured', () => {
    const providerIds = authConfig.providers.map((p: any) => (p as any).id)
    expect(providerIds).toContain('resend')
  })
})
