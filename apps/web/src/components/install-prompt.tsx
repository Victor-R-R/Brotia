'use client'

import { useEffect, useState } from 'react'

type Platform = 'ios-safari' | 'ios-other' | 'android' | 'other'

const detectPlatform = (): Platform => {
  const ua = navigator.userAgent
  const isIos = /iphone|ipad|ipod/i.test(ua)
  if (isIos) {
    // CriOS = Chrome iOS, FxiOS = Firefox iOS — ninguno soporta PWA install
    const isSafari = !/CriOS|FxiOS|OPiOS|mercury/i.test(ua)
    return isSafari ? 'ios-safari' : 'ios-other'
  }
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

    if (p === 'ios-safari' || p === 'ios-other') {
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

            {platform === 'ios-safari' && (
              <ol className="text-muted text-xs mt-1 space-y-0.5 list-none">
                <li>1. Pulsa <span className="font-semibold">Compartir</span> 📤 (abajo en Safari)</li>
                <li>2. Desplázate y pulsa <span className="font-semibold">&ldquo;En pantalla de inicio&rdquo;</span></li>
              </ol>
            )}

            {platform === 'ios-other' && (
              <p className="text-muted text-xs mt-0.5">
                Abre esta página en <span className="font-semibold">Safari</span> para instalarla en tu iPhone
              </p>
            )}

            {(platform === 'android' || platform === 'other') && (
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

        {platform !== 'ios-safari' && platform !== 'ios-other' && deferredPrompt && (
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
