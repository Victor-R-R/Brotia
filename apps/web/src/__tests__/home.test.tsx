import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'

vi.mock('@/lib/auth', () => ({
  auth: vi.fn().mockResolvedValue(null),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

import HomePage from '@/app/page'

// HomePage is an async Server Component — await it before rendering
describe('HomePage', () => {
  it('renders the Brotia heading', async () => {
    render(await HomePage())
    expect(screen.getByRole('heading', { name: /brotia/i })).toBeInTheDocument()
  })

  it('renders the login link', async () => {
    render(await HomePage())
    expect(screen.getByRole('link', { name: /entrar/i })).toHaveAttribute('href', '/login')
  })
})
