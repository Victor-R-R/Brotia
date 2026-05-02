import NextAuth, { type DefaultSession, type NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { db } from '@brotia/db'

declare module 'next-auth' {
  interface Session {
    user: { id: string; role: string; _impersonatedBy?: string } & DefaultSession['user']
  }
}


export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(db),
  session: { strategy: 'jwt' },
  providers: [
    Google({
      clientId:     process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    Credentials({
      credentials: {
        email:    { label: 'Email',      type: 'email'    },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user?.password) return null

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password,
        )

        if (!valid) return null

        return { id: user.id, email: user.email, name: user.name }
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id
      }
      const userId = (user?.id ?? token.sub) as string | undefined
      if (userId) {
        const dbUser = await db.user.findUnique({
          where: { id: userId },
          select: { role: true },
        })
        ;(token as Record<string, unknown>).role = dbUser?.role ?? 'USER'
      }
      return token
    },
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.sub!,
        role: ((token as Record<string, unknown>).role as string) ?? 'USER',
      },
    }),
  },
  pages: {
    signIn: '/login',
  },
}

const {
  handlers,
  auth: _auth,
  signIn,
  signOut,
} = NextAuth(authConfig)

export { handlers, signIn, signOut }

/**
 * Wraps NextAuth auth() to return null on JWTSessionError and handle superadmin impersonation.
 * When the brotia_impersonate cookie is set and the real user is SUPERADMIN,
 * the session is transparently replaced with the target user's data.
 */
export const auth = async () => {
  try {
    const session = await _auth()

    if (session?.user?.role === 'SUPERADMIN') {
      const cookieStore = await cookies()
      const impersonateId = cookieStore.get('brotia_impersonate')?.value
      if (impersonateId) {
        const target = await db.user.findUnique({
          where: { id: impersonateId },
          select: { id: true, email: true, name: true, image: true, role: true },
        })
        if (target) {
          return {
            ...session,
            user: {
              ...session.user,
              id: target.id,
              email: target.email,
              name: target.name,
              image: target.image,
              role: target.role as string,
              _impersonatedBy: session.user.id,
            },
          }
        }
      }
    }

    return session
  } catch (e) {
    if (
      e instanceof Error &&
      (e.name === 'JWTSessionError' || e.message.toLowerCase().includes('jwt'))
    ) {
      return null
    }
    throw e
  }
}
