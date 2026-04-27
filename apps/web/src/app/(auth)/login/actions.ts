'use server'

import { signIn } from '@/lib/auth'

export const signInWithGoogle = async () => {
  await signIn('google', { redirectTo: '/dashboard' })
}

export const signInWithEmail = async (fd: FormData) => {
  await signIn('resend', { email: fd.get('email'), redirectTo: '/' })
}
