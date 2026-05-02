import { NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import { db } from '@brotia/db'
import { auth } from '@/lib/auth'

// POST /api/auth/mobile-code/generate — authenticated, generates 6-digit code
export const POST = async (req: Request) => {
  const url = new URL(req.url)

  // ── Generate a code (requires session) ──────────────────────────────────
  if (url.searchParams.get('action') === 'generate') {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    // Delete any existing code for this user
    await db.mobileAuthCode.deleteMany({ where: { userId: session.user.id } })

    const code      = String(Math.floor(100000 + Math.random() * 900000))
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 min

    await db.mobileAuthCode.create({
      data: { code, userId: session.user.id, expiresAt },
    })

    return NextResponse.json({ code })
  }

  // ── Redeem a code (public, returns JWT) ─────────────────────────────────
  if (url.searchParams.get('action') === 'redeem') {
    const { code } = await req.json()
    if (!code) return NextResponse.json({ error: 'missing_code' }, { status: 400 })

    const record = await db.mobileAuthCode.findUnique({ where: { code }, include: { user: true } })

    if (!record) {
      return NextResponse.json({ error: 'invalid_code' }, { status: 401 })
    }
    if (record.expiresAt < new Date()) {
      await db.mobileAuthCode.delete({ where: { code } })
      return NextResponse.json({ error: 'expired_code' }, { status: 401 })
    }

    // One-time use — delete immediately
    await db.mobileAuthCode.delete({ where: { code } })

    const secret = new TextEncoder().encode(process.env.AUTH_SECRET!)
    const token  = await new SignJWT({ email: record.user.email })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(record.user.id)
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(secret)

    return NextResponse.json({
      token,
      user: {
        id:       record.user.id,
        email:    record.user.email,
        name:     record.user.name,
        lastName: record.user.lastName,
      },
    })
  }

  return NextResponse.json({ error: 'missing_action' }, { status: 400 })
}
