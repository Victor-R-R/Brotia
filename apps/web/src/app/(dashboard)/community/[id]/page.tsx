import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@brotia/db'
import { CommunityThread, type ThreadDetail } from '@/components/community/community-thread'

type Props = { params: Promise<{ id: string }> }

const ThreadPage = async ({ params }: Props) => {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { id } = await params

  const thread = await db.forumThread.findUnique({
    where: { id },
    select: {
      id: true, title: true, category: true, content: true,
      images: true, createdAt: true, userId: true,
      user:   { select: { name: true, lastName: true, avatar: true } },
      _count: { select: { replies: true, likes: true } },
      likes:  { where: { userId: session.user.id }, select: { id: true } },
      replies: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true, content: true, images: true, createdAt: true, userId: true,
          user:   { select: { name: true, lastName: true, avatar: true } },
          _count: { select: { likes: true } },
          likes:  { where: { userId: session.user.id }, select: { id: true } },
        },
      },
    },
  })

  if (!thread) notFound()

  const detail: ThreadDetail = {
    id:             thread.id,
    title:          thread.title,
    category:       thread.category,
    content:        thread.content,
    contentPreview: thread.content.slice(0, 200),
    images:         thread.images,
    createdAt:      thread.createdAt.toISOString(),
    userId:         thread.userId,
    user:           thread.user,
    _count:         thread._count,
    hasLiked:       thread.likes.length > 0,
    replies:        thread.replies.map(r => ({
      id:        r.id,
      content:   r.content,
      images:    r.images,
      createdAt: r.createdAt.toISOString(),
      userId:    r.userId,
      user:      r.user,
      _count:    r._count,
      hasLiked:  r.likes.length > 0,
    })),
  }

  return <CommunityThread thread={detail} sessionUserId={session.user.id} />
}

export default ThreadPage
