import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/get-auth-user'
import { db } from '@brotia/db'

type Params = { params: Promise<{ id: string }> }

export const DELETE = async (req: Request, { params }: Params) => {
  const user = await getAuthUser(req)
  if (!user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  try {
    const { id } = await params

    const reply = await db.forumReply.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!reply) return NextResponse.json({ error: 'not_found' }, { status: 404 })
    if (reply.userId !== user.id) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

    await db.forumReply.delete({ where: { id } })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
