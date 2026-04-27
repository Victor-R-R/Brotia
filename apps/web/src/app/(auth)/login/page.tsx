'use client'

import { Suspense } from 'react'
import { useActionState } from 'react'
import Link from 'next/link'
import { signInWithGoogle, signInWithCredentials } from './actions'
import { useSearchParams } from 'next/navigation'

type State = { error: string } | void

const LoginForm = () => {
  const [state, action, isPending] = useActionState<State, FormData>(signInWithCredentials, undefined)
  const params = useSearchParams()
  const registered = params.get('registered')

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="bg-surface rounded-md p-8 shadow-md w-full max-w-sm border border-border">
        <h1 className="font-heading text-2xl text-foreground mb-1">Brotia</h1>
        <p className="text-muted text-sm mb-6">Accede a tus invernaderos</p>

        {registered && (
          <div className="mb-4 rounded-md bg-mint border border-border px-3 py-2 text-sm text-primary font-medium">
            ¡Cuenta creada! Ya puedes iniciar sesión.
          </div>
        )}

        {state?.error && (
          <div className="mb-4 rounded-md bg-danger border border-danger px-3 py-2 text-sm text-danger-text">
            {state.error}
          </div>
        )}

        <form action={action} className="flex flex-col gap-3">
          <input
            name="email"
            type="email"
            required
            placeholder="correo@ejemplo.com"
            className="w-full bg-surface border border-border rounded-md px-3 py-2.5 text-sm text-foreground placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
          />
          <input
            name="password"
            type="password"
            required
            placeholder="Contraseña"
            className="w-full bg-surface border border-border rounded-md px-3 py-2.5 text-sm text-foreground placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
          />
          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-primary text-white rounded-md py-2.5 px-4 text-sm font-medium hover:bg-primary-hover transition-colors cursor-pointer disabled:opacity-60"
          >
            {isPending ? 'Entrando…' : 'Iniciar sesión'}
          </button>
        </form>

        <div className="flex items-center gap-2 my-4">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-subtle">o</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <form action={signInWithGoogle}>
          <button
            type="submit"
            className="w-full bg-surface-alt border border-border text-foreground rounded-md py-2.5 px-4 text-sm font-medium hover:bg-surface-raised transition-colors cursor-pointer"
          >
            Continuar con Google
          </button>
        </form>

        <p className="text-center text-sm text-muted mt-6">
          ¿No tienes cuenta?{' '}
          <Link href="/register" className="text-primary font-medium hover:underline">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  )
}

const LoginPage = () => (
  <Suspense>
    <LoginForm />
  </Suspense>
)

export default LoginPage
