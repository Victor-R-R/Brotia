import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@brotia/db', () => ({
  db: {
    conversation: {
      findMany:  vi.fn(),
      create:    vi.fn(),
      findFirst: vi.fn(),
      delete:    vi.fn(),
    },
    chatMessage: {
      findMany: vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth', () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: 'user-1', email: 'farmer@test.com' } }),
}))

import { db } from '@brotia/db'
import { auth } from '@/lib/auth'
import { GET, POST } from '../app/api/conversations/route'
import { GET as GET_MESSAGES, DELETE } from '../app/api/conversations/[id]/route'

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1', email: 'farmer@test.com' } } as any)
})

describe('GET /api/conversations', () => {
  it('returns conversations for authenticated user', async () => {
    vi.mocked(db.conversation.findMany).mockResolvedValue([
      { id: 'conv-1', title: 'Consulta plagas', createdAt: new Date(), updatedAt: new Date() },
    ] as any)

    const res = await GET(new Request('http://localhost/api/conversations'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toHaveLength(1)
    expect(body[0].title).toBe('Consulta plagas')
  })

  it('returns 401 when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null as any)

    const res = await GET(new Request('http://localhost/api/conversations'))
    expect(res.status).toBe(401)
  })
})

describe('POST /api/conversations', () => {
  it('creates a conversation with custom title', async () => {
    vi.mocked(db.conversation.create).mockResolvedValue({
      id: 'conv-2', title: 'Consulta plagas', userId: 'user-1', createdAt: new Date(), updatedAt: new Date(),
    } as any)

    const res = await POST(new Request('http://localhost/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Consulta plagas' }),
    }))
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.title).toBe('Consulta plagas')
  })

  it('creates a conversation with default title when no title given', async () => {
    vi.mocked(db.conversation.create).mockResolvedValue({
      id: 'conv-3', title: 'Nueva conversación', userId: 'user-1', createdAt: new Date(), updatedAt: new Date(),
    } as any)

    await POST(new Request('http://localhost/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    }))

    const createCall = vi.mocked(db.conversation.create).mock.calls[0][0]
    expect(createCall.data.title).toBe('Nueva conversación')
  })

  it('truncates title to 80 chars', async () => {
    vi.mocked(db.conversation.create).mockResolvedValue({
      id: 'conv-4', title: 'a'.repeat(80), userId: 'user-1', createdAt: new Date(), updatedAt: new Date(),
    } as any)

    await POST(new Request('http://localhost/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'a'.repeat(100) }),
    }))

    const createCall = vi.mocked(db.conversation.create).mock.calls[0][0]
    expect(createCall.data.title.length).toBeLessThanOrEqual(80)
  })

  it('returns 401 when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null as any)

    const res = await POST(new Request('http://localhost/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Test' }),
    }))
    expect(res.status).toBe(401)
  })
})

describe('DELETE /api/conversations/:id', () => {
  it('deletes a conversation owned by the user', async () => {
    vi.mocked(db.conversation.findFirst).mockResolvedValue({
      id: 'conv-1', title: 'Test', userId: 'user-1', createdAt: new Date(), updatedAt: new Date(),
    } as any)
    vi.mocked(db.conversation.delete).mockResolvedValue({ id: 'conv-1' } as any)

    const res = await DELETE(
      new Request('http://localhost/api/conversations/conv-1', { method: 'DELETE' }),
      { params: Promise.resolve({ id: 'conv-1' }) }
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
  })

  it('returns 404 for a conversation that does not belong to the user', async () => {
    vi.mocked(db.conversation.findFirst).mockResolvedValue(null)

    const res = await DELETE(
      new Request('http://localhost/api/conversations/conv-999', { method: 'DELETE' }),
      { params: Promise.resolve({ id: 'conv-999' }) }
    )
    expect(res.status).toBe(404)
  })

  it('returns 401 when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null as any)

    const res = await DELETE(
      new Request('http://localhost/api/conversations/conv-1', { method: 'DELETE' }),
      { params: Promise.resolve({ id: 'conv-1' }) }
    )
    expect(res.status).toBe(401)
  })
})

describe('GET /api/conversations/:id (messages)', () => {
  it('returns messages for authorized user', async () => {
    vi.mocked(db.chatMessage.findMany).mockResolvedValue([
      { id: 'msg-1', role: 'user', content: 'Hola, tengo problemas con mis tomates', imageUrl: null, createdAt: new Date() },
      { id: 'msg-2', role: 'assistant', content: 'Cuéntame más sobre los síntomas', imageUrl: null, createdAt: new Date() },
    ] as any)

    const res = await GET_MESSAGES(
      new Request('http://localhost/api/conversations/conv-1'),
      { params: Promise.resolve({ id: 'conv-1' }) }
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toHaveLength(2)
    expect(body[0].role).toBe('user')
    expect(body[1].role).toBe('assistant')
  })

  it('returns 401 when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null as any)

    const res = await GET_MESSAGES(
      new Request('http://localhost/api/conversations/conv-1'),
      { params: Promise.resolve({ id: 'conv-1' }) }
    )
    expect(res.status).toBe(401)
  })
})
