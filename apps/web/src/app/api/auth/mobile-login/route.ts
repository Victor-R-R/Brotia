import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'
import { db } from '@brotia/db'

export const POST = async (req: Request) => {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { email } })
    if (!user?.password) {
      return NextResponse.json({ error: 'invalid_credentials' }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return NextResponse.json({ error: 'invalid_credentials' }, { status: 401 })
    }

    const secret = new TextEncoder().encode(process.env.AUTH_SECRET!)
    const token = await new SignJWT({ email: user.email, role: user.role })
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
  } catch {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
