import { NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import { db } from '@brotia/db'

// POST /api/auth/mobile-google — verifies Google access token, returns app JWT
export const POST = async (req: Request) => {
  const { accessToken } = await req.json()
  if (!accessToken) return NextResponse.json({ error: 'missing_token' }, { status: 400 })

  // Verify the access token with Google and get the user's profile
  const googleRes = await fetch(
    `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`
  )
  if (!googleRes.ok) return NextResponse.json({ error: 'invalid_token' }, { status: 401 })

  const { email, email_verified } = await googleRes.json() as {
    email: string
    email_verified: boolean
    name?: string
  }

  if (!email_verified) {
    return NextResponse.json({ error: 'email_not_verified' }, { status: 401 })
  }

  const user = await db.user.findUnique({ where: { email } })
  if (!user) {
    return NextResponse.json({ error: 'user_not_found' }, { status: 404 })
  }

  const secret = new TextEncoder().encode(process.env.AUTH_SECRET!)
  const token  = await new SignJWT({ email: user.email, role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret)

  return NextResponse.json({
    token,
    user: {
      id:       user.id,
      email:    user.email,
      name:     user.name,
      lastName: user.lastName,
    },
  })
}
