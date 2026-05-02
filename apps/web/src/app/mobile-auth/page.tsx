import { auth, signIn } from '@/lib/auth'
import { db } from '@brotia/db'
import { MobileAuthRedirect } from './mobile-auth-redirect'

const ALLOWED_SCHEMES = ['brotia://', 'exp://']

const isAllowed = (uri: string) => ALLOWED_SCHEMES.some(s => uri.startsWith(s))

const MobileAuthPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ redirect_uri?: string }>
}) => {
  const params      = await searchParams
  const rawUri      = params.redirect_uri ?? ''
  const redirectUri = isAllowed(rawUri) ? rawUri : 'brotia://auth-callback'

  const session = await auth()

  if (!session?.user?.id) {
    const callbackUrl = `/mobile-auth?redirect_uri=${encodeURIComponent(redirectUri)}`
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
        <div className="text-center w-full max-w-sm">
          <div className="mb-6 text-5xl">🌱</div>
          <h1 className="font-heading text-2xl font-bold text-foreground mb-2">Brotia</h1>
          <p className="text-sm text-muted mb-8">Inicia sesión para conectar la app móvil</p>
          <form
            action={async () => {
              'use server'
              await signIn('google', { redirectTo: callbackUrl })
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-primary text-white
                         text-sm font-semibold py-3 px-6 rounded-xl hover:bg-primary-hover
                         transition-colors"
            >
              Continuar con Google
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Authenticated — generate a one-time code valid 5 min
  await db.mobileAuthCode.deleteMany({ where: { userId: session.user.id } })
  const code = String(Math.floor(100000 + Math.random() * 900000))
  await db.mobileAuthCode.create({
    data: { code, userId: session.user.id, expiresAt: new Date(Date.now() + 5 * 60 * 1000) },
  })

  return <MobileAuthRedirect code={code} redirectUri={redirectUri} />
}

export default MobileAuthPage
