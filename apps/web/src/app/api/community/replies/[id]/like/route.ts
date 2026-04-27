import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@brotia/db'

type Params = { params: Promise<{ id: string }> }

export const POST = async (_req: Request, { params }: Params) => {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  try {
    const { id: replyId } = await params

    const existing = await db.forumReplyLike.findUnique({
      where: { userId_replyId: { userId: session.user.id, replyId } },
    })

    if (existing) {
      await db.forumReplyLike.delete({
        where: { userId_replyId: { userId: session.user.id, replyId } },
      })
    } else {
      await db.forumReplyLike.create({
        data: { userId: session.user.id, replyId },
      })
    }

    const count = await db.forumReplyLike.count({ where: { replyId } })

    return NextResponse.json({ liked: !existing, count })
  } catch {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
