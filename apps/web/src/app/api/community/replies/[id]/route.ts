import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@brotia/db'

type Params = { params: Promise<{ id: string }> }

export const DELETE = async (_req: Request, { params }: Params) => {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  try {
    const { id } = await params

    const reply = await db.forumReply.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!reply) return NextResponse.json({ error: 'not_found' }, { status: 404 })
    if (reply.userId !== session.user.id) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

    await db.forumReply.delete({ where: { id } })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
