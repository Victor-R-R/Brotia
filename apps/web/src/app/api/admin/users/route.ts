import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/get-auth-user'
import { db } from '@brotia/db'

const requireSuperadmin = async (req: Request) => {
  const authUser = await getAuthUser(req)
  if (!authUser?.id) return null
  const dbUser = await db.user.findUnique({ where: { id: authUser.id }, select: { id: true, role: true } })
  if (dbUser?.role !== 'SUPERADMIN') return null
  return dbUser
}

export const GET = async (req: Request) => {
  const admin = await requireSuperadmin(req)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const users = await db.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id:        true,
        name:      true,
        lastName:  true,
        email:     true,
        role:      true,
        provider:  true,
        createdAt: true,
        _count: { select: { greenhouses: true } },
      },
    })
    return NextResponse.json(users)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}
