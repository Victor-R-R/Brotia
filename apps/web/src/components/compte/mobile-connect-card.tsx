'use client'

import { useState } from 'react'
import { Smartphone, RefreshCw } from 'lucide-react'

export const MobileConnectCard = () => {
  const [code,    setCode]    = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [seconds, setSeconds] = useState(0)

  const generate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/mobile-code?action=generate', { method: 'POST' })
      if (!res.ok) throw new Error()
      const { code: c } = await res.json() as { code: string }
      setCode(c)
      setSeconds(600)

      const interval = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) { clearInterval(interval); setCode(null); return 0 }
          return s - 1
        })
      }, 1000)
    } catch {
      // non-blocking
    } finally {
      setLoading(false)
    }
  }

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Smartphone className="size-5 text-primary" />
        </div>
        <div>
          <h2 className="font-heading font-semibold text-sm text-foreground">App móvil</h2>
          <p className="text-xs text-muted">Conecta la app Brotia en tu teléfono</p>
        </div>
      </div>

      {code ? (
        <div className="text-center">
          <p className="text-xs text-muted mb-2">
            Introduce este código en la app móvil
          </p>
          <div className="inline-flex gap-1.5 mb-3">
            {[code.slice(0,3), code.slice(3)].map((part, i) => (
              <span
                key={i}
                className="bg-surface-alt border border-border rounded-lg px-4 py-3
                           font-mono text-2xl font-bold text-foreground tracking-widest"
              >
                {part}
              </span>
            ))}
          </div>
          <p className="text-xs text-subtle">Expira en {fmt(seconds)}</p>
        </div>
      ) : (
        <button
          onClick={generate}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-primary text-white
                     text-sm font-medium py-2.5 rounded-lg hover:bg-primary-hover
                     transition-colors disabled:opacity-60"
        >
          {loading
            ? <RefreshCw className="size-4 animate-spin" />
            : <Smartphone className="size-4" />
          }
          Generar código de conexión
        </button>
      )}
    </div>
  )
}
