import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@brotia/db'

const PAGE_SIZE = 20

const threadSelect = (userId: string) => ({
  id: true, title: true, category: true, content: true,
  images: true, createdAt: true, userId: true,
  user: { select: { name: true, lastName: true, avatar: true } },
  _count: { select: { replies: true, likes: true } },
  likes: { where: { userId }, select: { id: true } },
})

export const GET = async (req: Request) => {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  try {
    const url      = new URL(req.url)
    const category = url.searchParams.get('category')
    const page     = parseInt(url.searchParams.get('page') ?? '1', 10)

    const threads = await db.forumThread.findMany({
      where:   category ? { category: category as any } : {},
      orderBy: { createdAt: 'desc' },
      skip:    (page - 1) * PAGE_SIZE,
      take:    PAGE_SIZE,
      select:  threadSelect(session.user.id),
    })

    return NextResponse.json(threads.map(t => ({
      id: t.id, title: t.title, category: t.category,
      contentPreview: t.content.slice(0, 200),
      images: t.images,
      createdAt: t.createdAt.toISOString(),
      userId: t.userId,
      user: t.user,
      _count: t._count,
      hasLiked: t.likes.length > 0,
    })))
  } catch {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}

export const POST = async (req: Request) => {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  try {
    const { title, content, images, category } = await req.json()

    if (!title?.trim() || !content?.trim() || !category) {
      return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
    }

    const thread = await db.forumThread.create({
      data: {
        title:   title.trim().slice(0, 150),
        content: content.trim(),
        images:  Array.isArray(images) ? images : [],
        category,
        userId:  session.user.id,
      },
      select: threadSelect(session.user.id),
    })

    return NextResponse.json({
      id: thread.id, title: thread.title, category: thread.category,
      contentPreview: thread.content.slice(0, 200),
      content: thread.content,
      images: thread.images,
      createdAt: thread.createdAt.toISOString(),
      userId: thread.userId,
      user: thread.user,
      _count: thread._count,
      hasLiked: false,
    }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
