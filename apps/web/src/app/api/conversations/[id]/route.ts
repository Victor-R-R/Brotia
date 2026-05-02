import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/get-auth-user'
import { db } from '@brotia/db'

type Params = { params: Promise<{ id: string }> }

export const DELETE = async (req: Request, { params }: Params) => {
  const user = await getAuthUser(req)
  if (!user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    const conversation = await db.conversation.findFirst({
      where: { id, userId: user.id },
    })
    if (!conversation) return NextResponse.json({ error: 'not_found' }, { status: 404 })

    await db.conversation.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}

export const GET = async (req: Request, { params }: Params) => {
  const user = await getAuthUser(req)
  if (!user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    const messages = await db.chatMessage.findMany({
      where:   { conversationId: id, conversation: { userId: user.id } },
      orderBy: { createdAt: 'asc' },
      select:  { id: true, role: true, content: true, imageUrl: true, createdAt: true },
    })
    return NextResponse.json(messages)
  } catch {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
