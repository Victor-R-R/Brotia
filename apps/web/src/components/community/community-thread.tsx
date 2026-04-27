'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, Send, Trash2 } from 'lucide-react'
import { UserAvatar, formatUserName } from './user-avatar'
import { ReplyBubble, type ReplyItem } from './reply-bubble'

export type ThreadDetail = {
  id:             string
  title:          string
  category:       string
  content:        string
  contentPreview: string
  images:         string[]
  createdAt:      string
  userId:         string
  user:           { name: string | null; lastName: string | null; avatar: string | null }
  _count:         { replies: number; likes: number }
  hasLiked:       boolean
  replies:        ReplyItem[]
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })

type Props = { thread: ThreadDetail; sessionUserId: string }

export const CommunityThread = ({ thread: initial, sessionUserId }: Props) => {
  const router     = useRouter()
  const scrollRef  = useRef<HTMLDivElement>(null)
  const [thread,  setThread]  = useState(initial)
  const [replies, setReplies] = useState(initial.replies)
  const [input,   setInput]   = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [replies])

  const likeThread = useCallback(async () => {
    const res = await fetch(`/api/community/${thread.id}/like`, { method: 'POST' })
    if (!res.ok) return
    const { liked, count } = await res.json()
    setThread(t => ({ ...t, hasLiked: liked, _count: { ...t._count, likes: count } }))
  }, [thread.id])

  const likeReply = useCallback(async (replyId: string) => {
    const res = await fetch(`/api/community/replies/${replyId}/like`, { method: 'POST' })
    if (!res.ok) return
    const { liked, count } = await res.json()
    setReplies(prev => prev.map(r =>
      r.id === replyId ? { ...r, hasLiked: liked, _count: { likes: count } } : r
    ))
  }, [])

  const deleteThread = useCallback(async () => {
    if (!confirm('¿Eliminar esta pregunta? Esta acción es irreversible.')) return
    await fetch(`/api/community/${thread.id}`, { method: 'DELETE' })
    router.push('/community')
  }, [thread.id, router])

  const deleteReply = useCallback(async (replyId: string) => {
    if (!confirm('¿Eliminar esta respuesta?')) return
    await fetch(`/api/community/replies/${replyId}`, { method: 'DELETE' })
    setReplies(prev => prev.filter(r => r.id !== replyId))
  }, [])

  const sendReply = useCallback(async () => {
    const text = input.trim()
    if (!text || sending) return
    setSending(true)
    setInput('')
    try {
      const res = await fetch(`/api/community/${thread.id}/replies`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ content: text, images: [] }),
      })
      if (!res.ok) return
      const reply: ReplyItem = await res.json()
      setReplies(prev => [...prev, reply])
    } finally {
      setSending(false)
    }
  }, [input, sending, thread.id])

  const isOwnThread = thread.userId === sessionUserId

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">

        {/* Original post */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex gap-3 mb-3">
            <UserAvatar user={thread.user} size={44} />
            <div className="flex-1 min-w-0">
              <span className="inline-block text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full mb-1">
                {thread.category}
              </span>
              <h1 className="font-heading font-bold text-foreground text-lg leading-snug">
                {thread.title}
              </h1>
              <p className="text-xs text-muted mt-0.5">
                {formatUserName(thread.user.name, thread.user.lastName)} · {formatDate(thread.createdAt)}
              </p>
            </div>
          </div>
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap mb-4">
            {thread.content}
          </p>
          <div className="flex items-center gap-4 pt-3 border-t border-border">
            <button
              onClick={likeThread}
              className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
            >
              <Heart
                className="size-4"
                fill={thread.hasLiked ? '#ef4444' : 'none'}
                color={thread.hasLiked ? '#ef4444' : 'currentColor'}
              />
              <span>{thread._count.likes}</span>
            </button>
            <span className="text-sm text-muted">{replies.length} respuestas</span>
            {isOwnThread && (
              <button
                onClick={deleteThread}
                className="ml-auto text-muted hover:text-danger transition-colors"
              >
                <Trash2 className="size-4" />
              </button>
            )}
          </div>
        </div>

        {/* Replies */}
        <div className="space-y-4">
          {replies.map(reply => (
            <ReplyBubble
              key={reply.id}
              reply={reply}
              isOwn={reply.userId === sessionUserId}
              onLike={likeReply}
              onDelete={deleteReply}
            />
          ))}
        </div>
      </div>

      {/* Reply input */}
      <div className="border-t border-border bg-background p-4">
        <div className="flex items-end gap-2 max-w-3xl mx-auto">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) sendReply() }}
            placeholder="Escribe tu respuesta..."
            rows={1}
            className="flex-1 resize-none bg-surface border border-border rounded-xl px-4 py-2.5 text-sm
                       text-foreground placeholder:text-muted focus:outline-none focus:ring-2
                       focus:ring-primary/40 focus:border-primary max-h-32 overflow-y-auto"
            style={{ fieldSizing: 'content' } as React.CSSProperties}
          />
          <button
            onClick={sendReply}
            disabled={sending || !input.trim()}
            className="size-10 rounded-xl bg-primary flex items-center justify-center
                       hover:bg-primary-hover transition-colors disabled:opacity-40 shrink-0"
          >
            <Send className="size-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}
