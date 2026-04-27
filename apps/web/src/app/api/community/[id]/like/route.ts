import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@brotia/db'

type Params = { params: Promise<{ id: string }> }

export const POST = async (_req: Request, { params }: Params) => {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  try {
    const { id: threadId } = await params

    const existing = await db.forumThreadLike.findUnique({
      where: { userId_threadId: { userId: session.user.id, threadId } },
    })

    if (existing) {
      await db.forumThreadLike.delete({
        where: { userId_threadId: { userId: session.user.id, threadId } },
      })
    } else {
      await db.forumThreadLike.create({
        data: { userId: session.user.id, threadId },
      })
    }

    const count = await db.forumThreadLike.count({ where: { threadId } })

    return NextResponse.json({ liked: !existing, count })
  } catch {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
