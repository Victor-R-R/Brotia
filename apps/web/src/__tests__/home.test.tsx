import { render, screen } from '@testing-library/react'
import HomePage from '@/app/page'

describe('HomePage', () => {
  it('renders the Brotia heading', () => {
    render(<HomePage />)
    expect(screen.getByRole('heading', { name: /brotia/i })).toBeInTheDocument()
  })

  it('renders the login link', () => {
    render(<HomePage />)
    expect(screen.getByRole('link', { name: /entrar/i })).toHaveAttribute('href', '/login')
  })
})
