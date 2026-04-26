import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@brotia/db'
import { updateGreenhouseSchema } from '@brotia/api'

type Params = { params: Promise<{ id: string }> }

export const GET = async (_req: Request, { params }: Params) => {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const greenhouse = await db.greenhouse.findFirst({
    where:   { id, userId: session.user.id },
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
}

export const PUT = async (req: Request, { params }: Params) => {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const existing = await db.greenhouse.findFirst({ where: { id, userId: session.user.id } })

  if (!existing) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const body = await req.json()
  const parsed = updateGreenhouseSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const updated = await db.greenhouse.update({ where: { id }, data: parsed.data })
  return NextResponse.json(updated)
}

export const DELETE = async (_req: Request, { params }: Params) => {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const existing = await db.greenhouse.findFirst({ where: { id, userId: session.user.id } })

  if (!existing) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  await db.greenhouse.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
