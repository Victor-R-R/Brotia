import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/get-auth-user'
import { db } from '@brotia/db'
import { updateGreenhouseSchema } from '@brotia/api'

type Params = { params: Promise<{ id: string }> }

export const GET = async (req: Request, { params }: Params) => {
  const user = await getAuthUser(req)
  if (!user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const greenhouse = await db.greenhouse.findFirst({
      where:   { id, userId: user.id },
      include: {
        crops:  true,
        notes:  { orderBy: { createdAt: 'desc' }, take: 5 },
        alerts: { where: { read: false } },
      },
    })

    if (!greenhouse) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }

    return NextResponse.json(greenhouse)
  } catch {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}

export const PUT = async (req: Request, { params }: Params) => {
  const user = await getAuthUser(req)
  if (!user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const parsed = updateGreenhouseSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const existing = await db.greenhouse.findFirst({ where: { id, userId: user.id } })

    if (!existing) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }

    const updated = await db.greenhouse.update({ where: { id }, data: parsed.data })
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}

export const DELETE = async (req: Request, { params }: Params) => {
  const user = await getAuthUser(req)
  if (!user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const result = await db.greenhouse.deleteMany({
      where: { id, userId: user.id },
    })

    if (result.count === 0) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
