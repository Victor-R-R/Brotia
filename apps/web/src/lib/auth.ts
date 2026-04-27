import NextAuth, { type DefaultSession, type NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import { db } from '@brotia/db'

declare module 'next-auth' {
  interface Session {
    user: { id: string } & DefaultSession['user']
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
    jwt: ({ token, user }) => {
      if (user) token.id = user.id
      return token
    },
    session: ({ session, token }) => ({
      ...session,
      user: { ...session.user, id: token.sub! },
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
 * Wraps NextAuth auth() to return null on JWTSessionError (stale cookies from
 * previous database-session strategy) instead of throwing.
 */
export const auth = async () => {
  try {
    return await _auth()
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
