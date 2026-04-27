'use client'

import { useState } from 'react'
import { Heart, Trash2 } from 'lucide-react'
import { UserAvatar, formatUserName } from './user-avatar'

export type ReplyItem = {
  id:        string
  content:   string
  images:    string[]
  createdAt: string
  userId:    string
  user:      { name: string | null; lastName: string | null; avatar: string | null }
  _count:    { likes: number }
  hasLiked:  boolean
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })

type Props = {
  reply:     ReplyItem
  isOwn:     boolean
  onLike:    (id: string) => void
  onDelete:  (id: string) => void
}

export const ReplyBubble = ({ reply, isOwn, onLike, onDelete }: Props) => {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="flex gap-3 group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <UserAvatar user={reply.user} size={32} className="mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-sm font-semibold text-foreground">
            {formatUserName(reply.user.name, reply.user.lastName)}
          </span>
          <span className="text-xs text-muted">{formatDate(reply.createdAt)}</span>
        </div>
        <div className="bg-surface-alt border border-border rounded-xl rounded-tl-sm px-4 py-3">
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{reply.content}</p>
        </div>
        <div className="flex items-center gap-3 mt-1.5 pl-1">
          <button
            onClick={() => onLike(reply.id)}
            className="flex items-center gap-1 text-xs text-muted hover:text-foreground transition-colors"
          >
            <Heart
              className="size-3.5"
              fill={reply.hasLiked ? '#ef4444' : 'none'}
              color={reply.hasLiked ? '#ef4444' : 'currentColor'}
            />
            <span>{reply._count.likes}</span>
          </button>
          {isOwn && hovered && (
            <button
              onClick={() => onDelete(reply.id)}
              className="flex items-center gap-1 text-xs text-muted hover:text-danger transition-colors"
            >
              <Trash2 className="size-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
