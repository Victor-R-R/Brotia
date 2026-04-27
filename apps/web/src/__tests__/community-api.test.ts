import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@brotia/db', () => ({
  db: {
    forumThread: {
      findMany:   vi.fn(),
      create:     vi.fn(),
      findUnique: vi.fn(),
      delete:     vi.fn(),
    },
    forumReply: {
      create:     vi.fn(),
      findUnique: vi.fn(),
      delete:     vi.fn(),
    },
    forumThreadLike: {
      findUnique: vi.fn(),
      create:     vi.fn(),
      delete:     vi.fn(),
      count:      vi.fn(),
    },
    forumReplyLike: {
      findUnique: vi.fn(),
      create:     vi.fn(),
      delete:     vi.fn(),
      count:      vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth', () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: 'user-1', email: 'farmer@test.com' } }),
}))

import { db } from '@brotia/db'
import { GET, POST } from '../app/api/community/route'
import { GET as GET_DETAIL, DELETE as DELETE_THREAD } from '../app/api/community/[id]/route'

const makeThread = (overrides = {}) => ({
  id: 'thread-1',
  title: 'Problema con plagas',
  category: 'PLAGAS',
  content: 'Mi tomate tiene manchas amarillas',
  images: [],
  createdAt: new Date('2026-01-01'),
  userId: 'user-1',
  user: { name: 'Ana', lastName: 'García', avatar: null },
  _count: { replies: 2, likes: 5 },
  likes: [],
  ...overrides,
})

const makeDetailThread = () => ({
  id: 'thread-1',
  title: 'Problema con plagas',
  category: 'PLAGAS',
  content: 'Descripción completa del problema con mi tomate',
  images: [],
  createdAt: new Date('2026-01-01'),
  userId: 'user-1',
  user: { name: 'Ana', lastName: 'García', avatar: null },
  _count: { replies: 1, likes: 3 },
  likes: [],
  replies: [{
    id: 'reply-1',
    content: 'Prueba con sulfato de cobre',
    images: [],
    createdAt: new Date('2026-01-02'),
    userId: 'user-2',
    user: { name: 'Carlos', lastName: 'López', avatar: null },
    _count: { likes: 1 },
    likes: [],
  }],
})

// ─── GET /api/community ───────────────────────────────────────────────────────

describe('GET /api/community', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns thread list for authenticated user', async () => {
    vi.mocked(db.forumThread.findMany).mockResolvedValue([makeThread()] as any)

    const req = new Request('http://localhost/api/community')
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toHaveLength(1)
    expect(body[0].title).toBe('Problema con plagas')
    expect(body[0].hasLiked).toBe(false)
    expect(body[0]).toHaveProperty('contentPreview')
    expect(body[0]).not.toHaveProperty('content')
  })

  it('sets hasLiked to true when user liked the thread', async () => {
    vi.mocked(db.forumThread.findMany).mockResolvedValue([
      makeThread({ likes: [{ id: 'like-1' }] }),
    ] as any)

    const req = new Request('http://localhost/api/community')
    const res = await GET(req)
    const body = await res.json()

    expect(body[0].hasLiked).toBe(true)
  })

  it('filters by category when ?category= is provided', async () => {
    vi.mocked(db.forumThread.findMany).mockResolvedValue([makeThread()] as any)

    const req = new Request('http://localhost/api/community?category=PLAGAS')
    await GET(req)

    expect(vi.mocked(db.forumThread.findMany)).toHaveBeenCalledWith(
      expect.objectContaining({ where: { category: 'PLAGAS' } })
    )
  })
})

// ─── POST /api/community ──────────────────────────────────────────────────────

describe('POST /api/community', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates a thread with valid data', async () => {
    const payload = { title: 'Nueva pregunta', content: 'Descripción detallada del problema', category: 'PLAGAS', images: [] }
    vi.mocked(db.forumThread.create).mockResolvedValue({
      id: 'thread-2', ...payload, userId: 'user-1', createdAt: new Date(),
      user: { name: 'Ana', lastName: 'García', avatar: null },
      _count: { replies: 0, likes: 0 },
      likes: [],
    } as any)

    const req = new Request('http://localhost/api/community', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.title).toBe('Nueva pregunta')
    expect(body.hasLiked).toBe(false)
  })

  it('returns 400 when title is missing', async () => {
    const req = new Request('http://localhost/api/community', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Hola', category: 'PLAGAS' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when category is missing', async () => {
    const req = new Request('http://localhost/api/community', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Titulo', content: 'Contenido' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})

// ─── GET /api/community/[id] ──────────────────────────────────────────────────

describe('GET /api/community/[id]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns thread detail with replies', async () => {
    vi.mocked(db.forumThread.findUnique).mockResolvedValue(makeDetailThread() as any)

    const req = new Request('http://localhost/api/community/thread-1')
    const res = await GET_DETAIL(req, { params: Promise.resolve({ id: 'thread-1' }) })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.content).toBe('Descripción completa del problema con mi tomate')
    expect(body.replies).toHaveLength(1)
    expect(body.replies[0].user.name).toBe('Carlos')
    expect(body.hasLiked).toBe(false)
  })

  it('returns 404 when thread not found', async () => {
    vi.mocked(db.forumThread.findUnique).mockResolvedValue(null)

    const req = new Request('http://localhost/api/community/nonexistent')
    const res = await GET_DETAIL(req, { params: Promise.resolve({ id: 'nonexistent' }) })

    expect(res.status).toBe(404)
  })
})

// ─── DELETE /api/community/[id] ───────────────────────────────────────────────

describe('DELETE /api/community/[id]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('deletes thread when user is the author', async () => {
    vi.mocked(db.forumThread.findUnique).mockResolvedValue({ userId: 'user-1' } as any)
    vi.mocked(db.forumThread.delete).mockResolvedValue({} as any)

    const req = new Request('http://localhost/api/community/thread-1', { method: 'DELETE' })
    const res = await DELETE_THREAD(req, { params: Promise.resolve({ id: 'thread-1' }) })

    expect(res.status).toBe(200)
  })

  it('returns 403 when user is not the author', async () => {
    vi.mocked(db.forumThread.findUnique).mockResolvedValue({ userId: 'other-user' } as any)

    const req = new Request('http://localhost/api/community/thread-1', { method: 'DELETE' })
    const res = await DELETE_THREAD(req, { params: Promise.resolve({ id: 'thread-1' }) })

    expect(res.status).toBe(403)
  })
})
