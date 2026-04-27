import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@brotia/db'
import { updateCropSchema } from '@brotia/api'

type Params = { params: Promise<{ id: string }> }

export const GET = async (_req: Request, { params }: Params) => {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const crop = await db.crop.findFirst({
      where: { id, greenhouse: { userId: session.user.id } },
    })

    if (!crop) return NextResponse.json({ error: 'not_found' }, { status: 404 })

    return NextResponse.json(crop)
  } catch {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}

export const PUT = async (req: Request, { params }: Params) => {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body   = await req.json()
  const parsed = updateCropSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const existing = await db.crop.findFirst({
      where: { id, greenhouse: { userId: session.user.id } },
    })

    if (!existing) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }

    const updated = await db.crop.update({ where: { id }, data: parsed.data })
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}

export const DELETE = async (_req: Request, { params }: Params) => {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const result = await db.crop.deleteMany({
      where: { id, greenhouse: { userId: session.user.id } },
    })

    if (result.count === 0) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
