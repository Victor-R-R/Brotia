import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@brotia/db', () => ({
  db: {
    conversation: {
      findFirst: vi.fn(),
      update:    vi.fn(),
    },
    chatMessage: {
      create: vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth', () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: 'user-1' } }),
}))

vi.mock('@ai-sdk/anthropic', () => ({
  anthropic: vi.fn(() => 'mock-model'),
}))

vi.mock('ai', () => ({
  streamText: vi.fn(() => ({
    consumeStream:             vi.fn(),
    toUIMessageStreamResponse: vi.fn(() => new Response('ok')),
  })),
  convertToModelMessages: vi.fn().mockResolvedValue([]),
  isFileUIPart:           vi.fn(() => false),
  isTextUIPart:           vi.fn((p: any) => p.type === 'text'),
}))

vi.mock('@vercel/blob', () => ({
  put: vi.fn(),
}))

import { db } from '@brotia/db'
import { auth } from '@/lib/auth'
import { POST } from '../app/api/chat/route'

const makeUserMessage = (text: string) => ({
  id: 'msg-1',
  role: 'user',
  parts: [{ type: 'text', text }],
  createdAt: new Date().toISOString(),
})

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any)
})

describe('POST /api/chat', () => {
  it('returns 401 when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null as any)

    const res = await POST(new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: 'conv-1', messages: [makeUserMessage('Hola')] }),
    }))

    expect(res.status).toBe(401)
  })

  it('returns 400 when conversationId is missing', async () => {
    const res = await POST(new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [makeUserMessage('Hola')] }),
    }))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('missing_conversationId')
  })

  it('returns 400 when messages array is empty', async () => {
    const res = await POST(new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: 'conv-1', messages: [] }),
    }))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('no_messages')
  })

  it('returns 404 when conversation does not exist or belongs to another user', async () => {
    vi.mocked(db.conversation.findFirst).mockResolvedValue(null)

    const res = await POST(new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: 'conv-999', messages: [makeUserMessage('Hola')] }),
    }))

    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('not_found')
  })

  it('calls streamText and returns stream when all inputs are valid', async () => {
    vi.mocked(db.conversation.findFirst).mockResolvedValue({
      id: 'conv-1', title: 'Nueva conversación', userId: 'user-1', createdAt: new Date(), updatedAt: new Date(),
    } as any)
    vi.mocked(db.conversation.update).mockResolvedValue({} as any)
    vi.mocked(db.chatMessage.create).mockResolvedValue({} as any)

    const { streamText } = await import('ai')

    const res = await POST(new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId: 'conv-1',
        messages: [makeUserMessage('Tengo manchas en las hojas de mis tomates')],
      }),
    }))

    expect(streamText).toHaveBeenCalled()
    expect(res).toBeInstanceOf(Response)
  })
})
