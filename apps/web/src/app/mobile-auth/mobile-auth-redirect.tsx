'use client'

import { useEffect } from 'react'

export const MobileAuthRedirect = ({ code, redirectUri }: { code: string; redirectUri: string }) => {
  useEffect(() => {
    window.location.href = `${redirectUri}?code=${code}`
  }, [code, redirectUri])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center px-6">
        <div className="mb-4 text-4xl">✅</div>
        <p className="font-heading text-lg font-semibold text-foreground mb-1">¡Conectado!</p>
        <p className="text-sm text-muted">Volviendo a la app Brotia…</p>
      </div>
    </div>
  )
}
