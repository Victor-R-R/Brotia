import { jwtVerify } from 'jose'
import { auth } from '@/lib/auth'

type AuthUser = { id: string; email: string; role: string }

const verifyMobileToken = async (req: Request): Promise<AuthUser | null> => {
  const header = req.headers.get('Authorization')
  if (!header?.startsWith('Bearer ')) return null

  const token = header.slice(7)
  try {
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET!)
    const { payload } = await jwtVerify(token, secret)
    if (!payload.sub || !payload.email) return null
    return {
      id:    payload.sub,
      email: payload.email as string,
      role:  (payload.role as string) ?? 'USER',
    }
  } catch {
    return null
  }
}

export const getAuthUser = async (req: Request): Promise<AuthUser | null> => {
  const session = await auth()
  if (session?.user?.id) {
    return { id: session.user.id, email: session.user.email ?? '', role: session.user.role ?? 'USER' }
  }
  return verifyMobileToken(req)
}
