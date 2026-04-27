import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@brotia/db'

export const GET = async () => {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
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
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json() as {
      name?:     string
      lastName?: string
      phone?:    string
      address?:  string
    }
    const user = await db.user.update({
      where: { id: session.user.id },
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

export const DELETE = async () => {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await db.user.delete({ where: { id: session.user.id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
