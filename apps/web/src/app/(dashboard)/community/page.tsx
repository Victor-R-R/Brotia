import { Suspense } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Plus } from 'lucide-react'
import { auth } from '@/lib/auth'
import { db } from '@brotia/db'
import { ThreadCard, type ThreadSummary } from '@/components/community/thread-card'
import { CategoryTabs } from '@/components/community/category-tabs'

type Props = { searchParams: Promise<{ category?: string }> }

const CommunityPage = async ({ searchParams }: Props) => {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { category } = await searchParams

  const threads = await db.forumThread.findMany({
    where:   category ? { category: category as any } : {},
    orderBy: { createdAt: 'desc' },
    take:    30,
    select: {
      id: true, title: true, category: true, content: true,
      images: true, createdAt: true, userId: true,
      user:   { select: { name: true, lastName: true, avatar: true } },
      _count: { select: { replies: true, likes: true } },
      likes:  { where: { userId: session.user.id }, select: { id: true } },
    },
  })

  const items: ThreadSummary[] = threads.map(t => ({
    id:             t.id,
    title:          t.title,
    category:       t.category,
    contentPreview: t.content.slice(0, 200),
    images:         t.images,
    createdAt:      t.createdAt.toISOString(),
    userId:         t.userId,
    user:           t.user,
    _count:         t._count,
    hasLiked:       t.likes.length > 0,
  }))

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-heading font-bold text-xl text-foreground">Comunidad</h1>
          <Link
            href="/community/new"
            className="flex items-center gap-1.5 bg-primary text-white text-sm font-medium
                       px-3 py-1.5 rounded-lg hover:bg-primary-hover transition-colors"
          >
            <Plus className="size-4" />
            Nueva pregunta
          </Link>
        </div>
        <Suspense>
          <CategoryTabs />
        </Suspense>
      </div>

      {/* Thread list */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted">
            <p className="text-sm">No hay publicaciones aún. ¡Sé el primero!</p>
          </div>
        ) : (
          <div className="space-y-3 max-w-2xl">
            {items.map(thread => (
              <ThreadCard key={thread.id} thread={thread} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default CommunityPage
