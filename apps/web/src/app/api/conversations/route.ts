import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/get-auth-user'
import { db } from '@brotia/db'

export const GET = async (req: Request) => {
  const user = await getAuthUser(req)
  if (!user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  try {
    const conversations = await db.conversation.findMany({
      where:   { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      select:  { id: true, title: true, createdAt: true, updatedAt: true },
    })
    return NextResponse.json(conversations)
  } catch {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}

export const POST = async (req: Request) => {
  const user = await getAuthUser(req)
  if (!user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  try {
    const { title } = await req.json()
    const conversation = await db.conversation.create({
      data: {
        title:  (title as string | undefined)?.slice(0, 80) || 'Nueva conversación',
        userId: user.id,
      },
    })
    return NextResponse.json(conversation, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
