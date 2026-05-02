import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/get-auth-user'
import { db } from '@brotia/db'

type Params = { params: Promise<{ id: string }> }

export const POST = async (req: Request, { params }: Params) => {
  const user = await getAuthUser(req)
  if (!user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  try {
    const { id: threadId } = await params
    const { content, images } = await req.json()

    if (!content?.trim()) {
      return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
    }

    const thread = await db.forumThread.findUnique({
      where: { id: threadId },
      select: { id: true },
    })
    if (!thread) return NextResponse.json({ error: 'not_found' }, { status: 404 })

    const reply = await db.forumReply.create({
      data: {
        content:  content.trim(),
        images:   Array.isArray(images) ? images : [],
        threadId,
        userId:   user.id,
      },
      select: {
        id: true, content: true, images: true, createdAt: true, userId: true,
        user: { select: { name: true, lastName: true, avatar: true } },
        _count: { select: { likes: true } },
      },
    })

    return NextResponse.json({
      ...reply,
      createdAt: reply.createdAt.toISOString(),
      hasLiked: false,
    }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
