import { signIn } from '@/lib/auth'

const LoginPage = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="bg-surface rounded-md p-8 shadow-md w-full max-w-sm border border-border">
      <h1 className="font-heading text-2xl text-foreground mb-2">Brotia</h1>
      <p className="text-muted text-sm mb-8">Accede a tus invernaderos</p>

      <div className="flex flex-col gap-3">
        <form action={async () => { 'use server'; await signIn('google') }}>
          <button
            type="submit"
            className="w-full bg-surface-alt border border-border text-foreground rounded-md py-2.5 px-4 text-sm font-medium hover:bg-surface-raised transition-colors cursor-pointer"
          >
            Continuar con Google
          </button>
        </form>

        <form action={async (fd: FormData) => {
          'use server'
          await signIn('resend', { email: fd.get('email'), redirectTo: '/' })
        }}>
          <input
            name="email"
            type="email"
            placeholder="tu@email.com"
            className="w-full bg-surface border border-border rounded-md px-3 py-2.5 text-sm text-foreground placeholder:text-subtle mb-2 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
          />
          <button
            type="submit"
            className="w-full bg-primary text-white rounded-md py-2.5 px-4 text-sm font-medium hover:bg-primary-hover transition-colors cursor-pointer"
          >
            Enviar enlace de acceso
          </button>
        </form>
      </div>
    </div>
  </div>
)

export default LoginPage
