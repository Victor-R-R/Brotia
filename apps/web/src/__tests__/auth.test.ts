import { describe, it, expect, vi } from 'vitest'

vi.mock('@brotia/db', () => ({
  db: { $connect: vi.fn(), $disconnect: vi.fn() },
}))

vi.mock('@auth/prisma-adapter', () => ({
  PrismaAdapter: vi.fn().mockReturnValue({}),
}))

vi.mock('next-auth', () => ({
  default: vi.fn(() => ({
    handlers: { GET: vi.fn(), POST: vi.fn() },
    auth: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
  })),
}))

import { authConfig } from '@/lib/auth'

describe('authConfig', () => {
  const providerIds = authConfig.providers.map((p) => (p as { id: string }).id)

  it('has Google provider configured', () => {
    expect(providerIds).toContain('google')
  })

  it('has Apple provider configured', () => {
    expect(providerIds).toContain('apple')
  })

  it('has Resend provider configured', () => {
    expect(providerIds).toContain('resend')
  })
})
