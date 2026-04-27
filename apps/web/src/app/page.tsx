import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'

const HomePage = async () => {
  const session = await auth()
  if (session?.user) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="font-heading text-4xl font-bold text-primary mb-4">Brotia</h1>
        <p className="text-muted mb-8">App de gestión de invernaderos</p>
        <Link
          href="/login"
          className="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-hover transition-colors"
        >
          Entrar
        </Link>
      </div>
    </div>
  )
}

export default HomePage
