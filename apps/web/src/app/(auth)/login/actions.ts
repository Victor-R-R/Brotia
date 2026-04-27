'use server'

import { AuthError } from 'next-auth'
import { signIn } from '@/lib/auth'

export const signInWithGoogle = async () => {
  await signIn('google', { redirectTo: '/' })
}

export const signInWithCredentials = async (
  _prev: unknown,
  formData: FormData,
): Promise<{ error: string } | void> => {
  try {
    await signIn('credentials', {
      email:      formData.get('email'),
      password:   formData.get('password'),
      redirectTo: '/',
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: 'Email o contraseña incorrectos' }
    }
    throw error
  }
}
