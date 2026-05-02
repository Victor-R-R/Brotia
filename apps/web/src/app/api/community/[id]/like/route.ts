import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/get-auth-user'
import { db } from '@brotia/db'

type Params = { params: Promise<{ id: string }> }

export const POST = async (req: Request, { params }: Params) => {
  const user = await getAuthUser(req)
  if (!user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  try {
    const { id: threadId } = await params

    const existing = await db.forumThreadLike.findUnique({
      where: { userId_threadId: { userId: user.id, threadId } },
    })

    if (existing) {
      await db.forumThreadLike.delete({
        where: { userId_threadId: { userId: user.id, threadId } },
      })
    } else {
      await db.forumThreadLike.create({
        data: { userId: user.id, threadId },
      })
    }

    const count = await db.forumThreadLike.count({ where: { threadId } })

    return NextResponse.json({ liked: !existing, count })
  } catch {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
