import type { Metadata, Viewport } from 'next'
import { Inter, Outfit } from 'next/font/google'
import { InstallPrompt } from '@/components/install-prompt'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-body' })
const outfit = Outfit({ subsets: ['latin'], variable: '--font-heading' })

export const metadata: Metadata = {
  title: 'Brotia — Gestión de Invernaderos',
  description: 'App para agricultores: clima, cultivos y alertas por invernadero',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Brotia',
  },
  icons: {
    apple: '/icons/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#1A7A30',
  viewportFit: 'cover',
}

const RootLayout = ({ children }: { children: React.ReactNode }) => (
  <html lang="es" className={`${inter.variable} ${outfit.variable}`} suppressHydrationWarning>
    <head>
      <script
        dangerouslySetInnerHTML={{
          __html: `if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js')`,
        }}
      />
    </head>
    <body className="bg-background text-foreground min-h-screen">
      {children}
      <InstallPrompt />
    </body>
  </html>
)

export default RootLayout
