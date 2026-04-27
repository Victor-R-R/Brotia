import Link from 'next/link'
import { Heart, MessageSquare } from 'lucide-react'
import { UserAvatar, formatUserName } from './user-avatar'

export type ThreadSummary = {
  id:             string
  title:          string
  category:       string
  contentPreview: string
  images:         string[]
  createdAt:      string
  userId:         string
  user:           { name: string | null; lastName: string | null; avatar: string | null }
  _count:         { replies: number; likes: number }
  hasLiked:       boolean
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })

type Props = { thread: ThreadSummary }

export const ThreadCard = ({ thread }: Props) => (
  <Link
    href={`/community/${thread.id}`}
    className="block bg-surface border border-border rounded-xl p-4 hover:border-primary/40 transition-colors"
  >
    <div className="flex gap-3">
      <UserAvatar user={thread.user} size={40} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            {thread.category}
          </span>
        </div>
        <h3 className="font-semibold text-foreground text-sm leading-snug mb-1 line-clamp-2">
          {thread.title}
        </h3>
        <p className="text-xs text-muted line-clamp-2 mb-2">{thread.contentPreview}</p>
        <div className="flex items-center gap-3 text-xs text-muted">
          <span className="font-medium text-foreground/70">
            {formatUserName(thread.user.name, thread.user.lastName)}
          </span>
          <span>·</span>
          <span>{formatDate(thread.createdAt)}</span>
          <span className="ml-auto flex items-center gap-3">
            <span className="flex items-center gap-1">
              <MessageSquare className="size-3.5" />
              {thread._count.replies}
            </span>
            <span className="flex items-center gap-1">
              <Heart
                className="size-3.5"
                fill={thread.hasLiked ? '#ef4444' : 'none'}
                color={thread.hasLiked ? '#ef4444' : 'currentColor'}
              />
              {thread._count.likes}
            </span>
          </span>
        </div>
      </div>
    </div>
  </Link>
)
