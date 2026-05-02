import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/get-auth-user'
import { db } from '@brotia/db'

export const GET = async (req: Request) => {
  const authUser = await getAuthUser(req)
  if (!authUser?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (authUser.role !== 'SUPERADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

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
