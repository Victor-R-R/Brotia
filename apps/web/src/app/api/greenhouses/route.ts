import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@brotia/db'
import { createGreenhouseSchema } from '@brotia/api'

export const GET = async (_req: Request) => {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  try {
    const greenhouses = await db.greenhouse.findMany({
      where:   { userId: session.user.id },
      include: { crops: { where: { status: 'GROWING' } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(greenhouses)
  } catch {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}

export const POST = async (req: Request) => {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = createGreenhouseSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const greenhouse = await db.greenhouse.create({
      data: { ...parsed.data, userId: session.user.id },
    })
    return NextResponse.json(greenhouse, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
