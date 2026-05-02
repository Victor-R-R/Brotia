import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/get-auth-user'
import { db } from '@brotia/db'

type Params = { params: Promise<{ id: string }> }

export const GET = async (req: Request, { params }: Params) => {
  const user = await getAuthUser(req)
  if (!user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  try {
    const { id } = await params

    const thread = await db.forumThread.findUnique({
      where: { id },
      select: {
        id: true, title: true, category: true, content: true,
        images: true, createdAt: true, userId: true,
        user: { select: { name: true, lastName: true, avatar: true } },
        _count: { select: { replies: true, likes: true } },
        likes: { where: { userId: user.id }, select: { id: true } },
        replies: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true, content: true, images: true, createdAt: true, userId: true,
            user: { select: { name: true, lastName: true, avatar: true } },
            _count: { select: { likes: true } },
            likes: { where: { userId: user.id }, select: { id: true } },
          },
        },
      },
    })

    if (!thread) return NextResponse.json({ error: 'not_found' }, { status: 404 })

    return NextResponse.json({
      id: thread.id, title: thread.title, category: thread.category,
      content: thread.content,
      contentPreview: thread.content.slice(0, 200),
      images: thread.images,
      createdAt: thread.createdAt.toISOString(),
      userId: thread.userId,
      user: thread.user,
      _count: thread._count,
      hasLiked: thread.likes.length > 0,
      replies: thread.replies.map(r => ({
        id: r.id, content: r.content, images: r.images,
        createdAt: r.createdAt.toISOString(),
        userId: r.userId,
        user: r.user,
        _count: r._count,
        hasLiked: r.likes.length > 0,
      })),
    })
  } catch {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}

export const DELETE = async (req: Request, { params }: Params) => {
  const user = await getAuthUser(req)
  if (!user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  try {
    const { id } = await params

    const thread = await db.forumThread.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!thread) return NextResponse.json({ error: 'not_found' }, { status: 404 })
    if (thread.userId !== user.id) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

    await db.forumThread.delete({ where: { id } })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
