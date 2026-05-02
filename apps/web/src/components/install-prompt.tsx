'use client'

import { useEffect, useState } from 'react'

type Platform = 'android' | 'ios' | 'other'

const detectPlatform = (): Platform => {
  const ua = navigator.userAgent
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios'
  if (/android/i.test(ua)) return 'android'
  return 'other'
}

const isInStandaloneMode = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true)

export const InstallPrompt = () => {
  const [platform, setPlatform] = useState<Platform>('other')
  const [deferredPrompt, setDeferredPrompt] = useState<Event & { prompt: () => void } | null>(null)
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (isInStandaloneMode()) return
    if (sessionStorage.getItem('pwa-dismissed')) return

    const p = detectPlatform()
    setPlatform(p)

    if (p === 'ios') {
      setVisible(true)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as Event & { prompt: () => void })
      setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    setVisible(false)
  }

  const handleDismiss = () => {
    sessionStorage.setItem('pwa-dismissed', '1')
    setDismissed(true)
    setVisible(false)
  }

  if (!visible || dismissed) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto">
      <div className="bg-surface border border-border rounded-xl p-4 shadow-lg flex flex-col gap-3">
        <div className="flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192.png" alt="Brotia" className="w-12 h-12 rounded-xl flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-heading font-semibold text-foreground text-sm">Instalar Brotia</p>
            {platform === 'ios' ? (
              <p className="text-muted text-xs mt-0.5">
                Pulsa <span className="font-semibold">⬜</span> y luego{' '}
                <span className="font-semibold">&ldquo;En pantalla de inicio&rdquo;</span>
              </p>
            ) : (
              <p className="text-muted text-xs mt-0.5">
                Accede sin navegador, como una app nativa
              </p>
            )}
          </div>
          <button
            onClick={handleDismiss}
            className="text-muted hover:text-foreground text-lg leading-none flex-shrink-0 -mt-0.5"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        {platform !== 'ios' && deferredPrompt && (
          <button
            onClick={handleInstall}
            className="w-full bg-primary text-white font-semibold text-sm py-2.5 rounded-lg hover:bg-primary-hover transition-colors"
          >
            Instalar aplicación
          </button>
        )}
      </div>
    </div>
  )
}
