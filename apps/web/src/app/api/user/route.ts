import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/get-auth-user'
import { db } from '@brotia/db'

export const GET = async (req: Request) => {
  const authUser = await getAuthUser(req)
  if (!authUser?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const user = await db.user.findUnique({
      where: { id: authUser.id },
      select: {
        id:       true,
        email:    true,
        name:     true,
        lastName: true,
        phone:    true,
        address:  true,
        provider: true,
      },
    })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(user)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}

export const PUT = async (req: Request) => {
  const authUser = await getAuthUser(req)
  if (!authUser?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json() as {
      name?:     string
      lastName?: string
      phone?:    string
      address?:  string
    }
    const user = await db.user.update({
      where: { id: authUser.id },
      data: {
        name:     body.name     ?? null,
        lastName: body.lastName ?? null,
        phone:    body.phone    ?? null,
        address:  body.address  ?? null,
      },
      select: {
        id:       true,
        email:    true,
        name:     true,
        lastName: true,
        phone:    true,
        address:  true,
      },
    })
    return NextResponse.json(user)
  } catch {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}

export const DELETE = async (req: Request) => {
  const authUser = await getAuthUser(req)
  if (!authUser?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await db.user.delete({ where: { id: authUser.id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
