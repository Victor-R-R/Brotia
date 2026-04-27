'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, UIMessage, isTextUIPart, isFileUIPart } from 'ai'
import { Bot, Plus, Send, Trash2, ImageIcon, X, MessageSquare } from 'lucide-react'
import Markdown from 'react-markdown'

type Conversation = {
  id:        string
  title:     string
  updatedAt: string
}

type DbMessage = {
  id:        string
  role:      string
  content:   string
  imageUrl:  string | null
  createdAt: string
}

const GREETING: UIMessage = {
  id:    'greeting',
  role:  'assistant',
  parts: [{ type: 'text', text: '¡Hola! Soy tu asesor técnico agrícola de Brotia 🌱\n\n¿En qué puedo ayudarte hoy? Puedo ayudarte con:\n- Identificar plagas o enfermedades en tus cultivos\n- Orientarte sobre tratamientos fitosanitarios registrados en España\n- Resolver dudas sobre buenas prácticas agronómicas\n- Interpretar síntomas en hortícolas, frutales, viñedo, olivar...\n\nCuéntame qué está pasando en tu invernadero o cultivo. Si puedes, dime también tu provincia para ajustar mejor el diagnóstico.' }],
  metadata: undefined,
}

const toProxiedUrl = (url: string) =>
  url.includes('vercel-storage.com')
    ? `/api/blob-proxy?url=${encodeURIComponent(url)}`
    : url

const dbToUIMessage = (m: DbMessage): UIMessage => ({
  id:   m.id,
  role: m.role as 'user' | 'assistant',
  parts: [
    ...(m.imageUrl ? [{ type: 'file' as const, mediaType: 'image/jpeg', url: toProxiedUrl(m.imageUrl) }] : []),
    { type: 'text' as const, text: m.content },
  ],
  metadata: undefined,
})

export const ChatInterface = () => {
  const [conversations, setConversations]             = useState<Conversation[]>([])
  const [activeId, setActiveId]                       = useState<string | null>(null)
  const [input, setInput]                             = useState('')
  const [pendingImage, setPendingImage]               = useState<File | null>(null)
  const [pendingImagePreview, setPendingImagePreview] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen]                 = useState(false)
  const [isPendingResponse, setIsPendingResponse]     = useState(false)
  const conversationIdRef                             = useRef<string | null>(null)
  const messagesEndRef                                = useRef<HTMLDivElement | null>(null)
  const fileInputRef                                  = useRef<HTMLInputElement | null>(null)
  const pollRef                                       = useRef<ReturnType<typeof setInterval> | null>(null)

  const transport = useMemo(
    () => new DefaultChatTransport({
      api:  '/api/chat',
      body: () => ({ conversationId: conversationIdRef.current }),
    }),
    [],
  )

  const { messages, status, sendMessage, setMessages, stop } = useChat({
    id:        'brotia-chat',
    transport,
    messages:  [GREETING],
    onFinish:  () => { fetchConversations() },
  })

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/conversations')
      if (res.ok) setConversations(await res.json())
    } catch { /* non-blocking */ }
  }, [])

  useEffect(() => { fetchConversations() }, [fetchConversations])

  useEffect(() => () => { stopPolling() }, [stopPolling])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
    setIsPendingResponse(false)
  }, [])

  const startPolling = useCallback((id: string) => {
    stopPolling()
    setIsPendingResponse(true)
    let attempts = 0
    pollRef.current = setInterval(async () => {
      attempts++
      if (attempts >= 6 || conversationIdRef.current !== id) {
        stopPolling()
        return
      }
      try {
        const res = await fetch(`/api/conversations/${id}`)
        if (!res.ok) return
        const dbMessages: DbMessage[] = await res.json()
        if (dbMessages[dbMessages.length - 1]?.role === 'assistant') {
          setMessages(dbMessages.map(dbToUIMessage))
          stopPolling()
        }
      } catch { /* non-blocking */ }
    }, 3000)
  }, [setMessages, stopPolling])

  const startNewChat = useCallback(() => {
    stop()
    stopPolling()
    conversationIdRef.current = null
    setActiveId(null)
    setMessages([GREETING])
    setSidebarOpen(false)
  }, [setMessages, stop, stopPolling])

  const selectConversation = useCallback(async (id: string) => {
    stop()
    stopPolling()
    try {
      const res = await fetch(`/api/conversations/${id}`)
      if (!res.ok) return
      const dbMessages: DbMessage[] = await res.json()
      conversationIdRef.current = id
      setActiveId(id)
      const uiMessages = dbMessages.length > 0 ? dbMessages.map(dbToUIMessage) : [GREETING]
      setMessages(uiMessages)
      setSidebarOpen(false)
      // If last message is from user, the AI response is still being generated server-side
      if (dbMessages.length > 0 && dbMessages[dbMessages.length - 1]?.role === 'user') {
        startPolling(id)
      }
    } catch { /* non-blocking */ }
  }, [setMessages, stop, stopPolling, startPolling])

  const deleteConversation = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await fetch(`/api/conversations/${id}`, { method: 'DELETE' })
      setConversations(prev => prev.filter(c => c.id !== id))
      if (activeId === id) startNewChat()
    } catch { /* non-blocking */ }
  }, [activeId, startNewChat])

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPendingImage(file)
    const reader = new FileReader()
    reader.onload = ev => setPendingImagePreview(ev.target?.result as string)
    reader.readAsDataURL(file)
    e.target.value = ''
  }, [])

  const removePendingImage = useCallback(() => {
    setPendingImage(null)
    setPendingImagePreview(null)
  }, [])

  const handleSend = useCallback(async () => {
    const text  = input.trim()
    const image = pendingImage

    if (!text && !image) return
    if (status !== 'ready') return

    setInput('')
    setPendingImage(null)
    setPendingImagePreview(null)

    // Create conversation on first user message
    if (!conversationIdRef.current) {
      try {
        const res  = await fetch('/api/conversations', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ title: text.slice(0, 80) || 'Consulta con imagen' }),
        })
        const data = await res.json()
        conversationIdRef.current = data.id
        setActiveId(data.id)
        setConversations(prev => [data, ...prev])
      } catch {
        return
      }
    }

    if (image) {
      const files = new DataTransfer()
      files.items.add(image)
      await sendMessage({ text: text || ' ', files: files.files })
    } else {
      await sendMessage({ text })
    }
  }, [input, pendingImage, status, sendMessage])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  const isLoading = status === 'streaming' || status === 'submitted'

  return (
    // Negative margins cancel the dashboard layout's padding, h-dvh fills viewport
    <div className="-m-4 -mb-20 md:-m-6 flex h-dvh overflow-hidden bg-surface">

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-foreground/20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Conversations sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-72 flex flex-col border-r border-border bg-surface
        transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:static md:translate-x-0 md:flex
      `}>
        <div className="p-4 border-b border-border">
          <button
            onClick={startNewChat}
            className="w-full flex items-center justify-center gap-2 bg-primary text-surface rounded-md py-2 text-sm font-medium hover:bg-primary-hover transition-colors"
          >
            <Plus className="size-4" />
            Nueva consulta
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {conversations.length === 0 ? (
            <p className="text-center text-subtle text-xs px-4 py-6">
              Aún no tienes consultas guardadas
            </p>
          ) : (
            conversations.map(c => (
              <div
                key={c.id}
                role="button"
                tabIndex={0}
                onClick={() => selectConversation(c.id)}
                onKeyDown={e => e.key === 'Enter' && selectConversation(c.id)}
                className={`w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-surface-alt transition-colors group cursor-pointer ${
                  activeId === c.id ? 'bg-surface-alt' : ''
                }`}
              >
                <MessageSquare className="size-4 text-subtle shrink-0" />
                <span className="flex-1 text-sm text-foreground truncate">{c.title}</span>
                <button
                  onClick={e => deleteConversation(c.id, e)}
                  className="shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-danger transition-all"
                  aria-label="Eliminar consulta"
                >
                  <Trash2 className="size-3 text-danger-text" />
                </button>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-surface shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-1.5 rounded hover:bg-surface-alt transition-colors"
            aria-label="Ver conversaciones"
          >
            <MessageSquare className="size-5 text-muted" />
          </button>
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-full bg-primary flex items-center justify-center">
              <Bot className="size-4 text-surface" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground font-heading">Brotia IA</p>
              <p className="text-xs text-subtle">Asesor técnico agrícola · España</p>
            </div>
          </div>
          {(isLoading || isPendingResponse) && (
            <span className="ml-auto text-xs text-subtle animate-pulse">Analizando...</span>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {messages.map(msg => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {((isLoading && messages[messages.length - 1]?.role === 'user') || isPendingResponse) && (
            <div className="flex gap-3">
              <div className="size-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                <Bot className="size-4 text-surface" />
              </div>
              <div className="bg-surface-alt rounded-xl px-4 py-3 flex items-center gap-1">
                <span className="size-2 bg-muted rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="size-2 bg-muted rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="size-2 bg-muted rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="shrink-0 border-t border-border p-4 pb-safe bg-surface" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
          {/* Image preview */}
          {pendingImagePreview && (
            <div className="mb-3 relative w-24">
              <img
                src={pendingImagePreview}
                alt="Imagen adjunta"
                className="w-24 h-24 object-cover rounded-md border border-border"
              />
              <button
                onClick={removePendingImage}
                className="absolute -top-1.5 -right-1.5 size-5 bg-danger rounded-full flex items-center justify-center"
              >
                <X className="size-3 text-danger-text" />
              </button>
            </div>
          )}

          <div className="flex items-end gap-2">
            {/* Image upload button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="shrink-0 p-2 rounded-md border border-border text-muted hover:text-foreground hover:border-primary/50 transition-colors"
              aria-label="Adjuntar imagen"
              disabled={isLoading}
            >
              <ImageIcon className="size-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />

            {/* Textarea */}
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe el problema de tu cultivo..."
              rows={1}
              disabled={isLoading}
              className="flex-1 resize-none bg-surface-alt border border-border rounded-md px-3 py-2.5 text-base md:text-sm text-foreground placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary disabled:opacity-50 max-h-32 overflow-y-auto"
              style={{ minHeight: '2.5rem' }}
              onInput={e => {
                const el = e.currentTarget
                el.style.height = 'auto'
                el.style.height = `${Math.min(el.scrollHeight, 128)}px`
              }}
            />

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={isLoading || (!input.trim() && !pendingImage)}
              className="shrink-0 p-2 rounded-md bg-primary text-surface hover:bg-primary-hover transition-colors disabled:opacity-40"
              aria-label="Enviar mensaje"
            >
              <Send className="size-5" />
            </button>
          </div>
          <p className="mt-2 text-xs text-subtle text-center">
            Siempre consulta con un técnico para diagnósticos definitivos
          </p>
        </div>
      </div>
    </div>
  )
}

const MessageBubble = ({ message }: { message: UIMessage }) => {
  const isUser = message.role === 'user'

  const textParts = message.parts.filter(isTextUIPart)
  const fileParts = message.parts.filter(isFileUIPart)

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isUser && (
        <div className="size-8 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1">
          <Bot className="size-4 text-surface" />
        </div>
      )}

      <div className={`max-w-[80%] space-y-2 ${isUser ? 'items-end flex flex-col' : ''}`}>
        {/* Image */}
        {fileParts.map((part, i) => (
          <img
            key={i}
            src={part.url}
            alt="Imagen adjunta"
            className="rounded-xl max-w-xs max-h-64 object-cover border border-border"
          />
        ))}

        {/* Text */}
        {textParts.map((part, i) => part.text && (
          <div
            key={i}
            className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${
              isUser
                ? 'bg-primary text-surface rounded-tr-sm whitespace-pre-wrap'
                : 'bg-surface-alt text-foreground rounded-tl-sm border border-border prose prose-sm prose-green max-w-none'
            }`}
          >
            {isUser
              ? part.text
              : <Markdown>{part.text}</Markdown>
            }
          </div>
        ))}
      </div>
    </div>
  )
}
