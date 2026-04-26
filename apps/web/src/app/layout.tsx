import type { Metadata } from 'next'
import { Inter, Outfit } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-body' })
const outfit = Outfit({ subsets: ['latin'], variable: '--font-heading' })

export const metadata: Metadata = {
  title: 'Brotia — Gestión de Invernaderos',
  description: 'App para agricultores: clima, cultivos y alertas por invernadero',
}

const RootLayout = ({ children }: { children: React.ReactNode }) => (
  <html lang="es" className={`${inter.variable} ${outfit.variable}`} suppressHydrationWarning>
    <body className="bg-background text-foreground min-h-screen">
      {children}
    </body>
  </html>
)

export default RootLayout
