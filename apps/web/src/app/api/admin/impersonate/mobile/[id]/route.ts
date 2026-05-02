import { NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import { getAuthUser } from '@/lib/get-auth-user'
import { db } from '@brotia/db'

const requireSuperadmin = async (req: Request) => {
  const authUser = await getAuthUser(req)
  if (!authUser?.id) return null
  const dbUser = await db.user.findUnique({ where: { id: authUser.id }, select: { id: true, role: true } })
  if (dbUser?.role !== 'SUPERADMIN') return null
  return { ...authUser, ...dbUser }
}

export const POST = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const admin = await requireSuperadmin(req)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params

  if (id === admin.id) {
    return NextResponse.json({ error: 'Cannot impersonate yourself' }, { status: 400 })
  }

  const target = await db.user.findUnique({
    where:  { id },
    select: { id: true, email: true, name: true, lastName: true, role: true },
  })
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const secret = new TextEncoder().encode(process.env.AUTH_SECRET!)
  const token  = await new SignJWT({
    email:           target.email,
    role:            target.role,
    _impersonatedBy: admin.id,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(target.id)
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secret)

  return NextResponse.json({
    token,
    user: { id: target.id, email: target.email, name: target.name, lastName: target.lastName },
  })
}
