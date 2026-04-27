import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@brotia/db'
import { createPestSchema } from '@brotia/api'

type Params = { params: Promise<{ id: string }> }

const ownsCrop = async (cropId: string, userId: string) =>
  db.crop.findFirst({ where: { id: cropId, greenhouse: { userId } } })

export const GET = async (_req: Request, { params }: Params) => {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { id } = await params
  if (!await ownsCrop(id, session.user.id)) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  try {
    const records = await db.pestRecord.findMany({
      where:   { cropId: id },
      orderBy: { detectedAt: 'desc' },
    })
    return NextResponse.json(records)
  } catch {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}

export const POST = async (req: Request, { params }: Params) => {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { id } = await params
  if (!await ownsCrop(id, session.user.id)) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const body   = await req.json()
  const parsed = createPestSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  try {
    const record = await db.pestRecord.create({
      data: { ...parsed.data, cropId: id, photos: [] },
    })
    return NextResponse.json(record, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
