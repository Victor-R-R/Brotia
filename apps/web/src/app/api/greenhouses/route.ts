import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/get-auth-user'
import { db } from '@brotia/db'
import { createGreenhouseSchema } from '@brotia/api'

export const GET = async (req: Request) => {
  const user = await getAuthUser(req)
  if (!user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  try {
    const greenhouses = await db.greenhouse.findMany({
      where:   { userId: user.id },
      include: { crops: { where: { status: 'GROWING' } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(greenhouses)
  } catch {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}

export const POST = async (req: Request) => {
  const user = await getAuthUser(req)
  if (!user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = createGreenhouseSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const greenhouse = await db.greenhouse.create({
      data: { ...parsed.data, userId: user.id },
    })
    return NextResponse.json(greenhouse, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
