import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/get-auth-user'
import { db } from '@brotia/db'

type Params = { params: Promise<{ id: string }> }

export const POST = async (req: Request, { params }: Params) => {
  const user = await getAuthUser(req)
  if (!user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  try {
    const { id: replyId } = await params

    const existing = await db.forumReplyLike.findUnique({
      where: { userId_replyId: { userId: user.id, replyId } },
    })

    if (existing) {
      await db.forumReplyLike.delete({
        where: { userId_replyId: { userId: user.id, replyId } },
      })
    } else {
      await db.forumReplyLike.create({
        data: { userId: user.id, replyId },
      })
    }

    const count = await db.forumReplyLike.count({ where: { replyId } })

    return NextResponse.json({ liked: !existing, count })
  } catch {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
