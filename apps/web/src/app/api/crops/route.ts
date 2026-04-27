import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@brotia/db'
import { createCropSchema } from '@brotia/api'

export const GET = async (_req: Request) => {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  try {
    const crops = await db.crop.findMany({
      where:   { greenhouse: { userId: session.user.id } },
      include: { greenhouse: { select: { id: true, name: true } } },
      orderBy: [{ status: 'asc' }, { plantedAt: 'desc' }],
    })
    return NextResponse.json(crops)
  } catch {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}

export const POST = async (req: Request) => {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body   = await req.json()
  const parsed = createCropSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const greenhouse = await db.greenhouse.findFirst({
    where: { id: parsed.data.greenhouseId, userId: session.user.id },
  })
  if (!greenhouse) {
    return NextResponse.json({ error: 'greenhouse_not_found' }, { status: 404 })
  }

  try {
    const crop = await db.crop.create({ data: parsed.data })
    return NextResponse.json(crop, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
