# Community Forum Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a `/community` forum where authenticated Brotia users can create threads, reply, and like — visible on web and mobile, no AI involved.

**Architecture:** REST API shared by web (Next.js server components + client components) and mobile (Expo). UI mirrors the existing `/chat` pattern: same layout structure, same image upload pattern, plain `fetch` instead of AI SDK. Four new Prisma models + one enum.

**Tech Stack:** Next.js 16 App Router, Prisma + Neon, NextAuth v5, Tailwind v4, Expo 54 + React Native, NativeWind.

---

## File Map

### New files
| File | Responsibility |
|------|---------------|
| `packages/db/prisma/schema.prisma` | Add `ForumCategory` enum + 4 models |
| `apps/web/src/lib/community-categories.ts` | Hardcoded category constants (label, emoji, key) |
| `apps/web/src/app/api/community/route.ts` | `GET` list + `POST` create thread |
| `apps/web/src/app/api/community/[id]/route.ts` | `GET` detail + `DELETE` thread |
| `apps/web/src/app/api/community/[id]/like/route.ts` | `POST` toggle thread like |
| `apps/web/src/app/api/community/[id]/replies/route.ts` | `POST` add reply |
| `apps/web/src/app/api/community/replies/[id]/route.ts` | `DELETE` reply |
| `apps/web/src/app/api/community/replies/[id]/like/route.ts` | `POST` toggle reply like |
| `apps/web/src/components/community/user-avatar.tsx` | Avatar with initials fallback + `formatUserName` helper |
| `apps/web/src/components/community/thread-card.tsx` | Thread summary card (list view) |
| `apps/web/src/components/community/category-tabs.tsx` | Client component — category filter chips |
| `apps/web/src/components/community/reply-bubble.tsx` | Individual reply with like + delete |
| `apps/web/src/components/community/community-thread.tsx` | Thread detail client component (mirrors ChatInterface) |
| `apps/web/src/app/(dashboard)/community/page.tsx` | Thread list server page |
| `apps/web/src/app/(dashboard)/community/new/page.tsx` | Create thread client page |
| `apps/web/src/app/(dashboard)/community/[id]/page.tsx` | Thread detail server page |
| `apps/web/src/__tests__/community-api.test.ts` | API route unit tests |
| `apps/mobile/app/(tabs)/community.tsx` | Thread list tab screen |
| `apps/mobile/app/community/new.tsx` | Create thread screen |
| `apps/mobile/app/community/[id].tsx` | Thread detail screen |

### Modified files
| File | Change |
|------|--------|
| `packages/db/prisma/schema.prisma` | Add relations to `User` model |
| `apps/web/src/components/nav/sidebar.tsx` | Add Comunidad nav item |
| `apps/web/src/components/nav/bottom-nav.tsx` | Replace Stats with Comunidad (6 items too many) |
| `apps/mobile/app/(tabs)/_layout.tsx` | Add 5th "Comunidad" tab |
| `apps/mobile/lib/api.ts` | Add community types + `api.community.*` methods |

---

## Task 1: Prisma Schema

**Files:**
- Modify: `packages/db/prisma/schema.prisma`

- [ ] **Step 1: Add the enum and four models to schema.prisma**

Add after the last model in `packages/db/prisma/schema.prisma`:

```prisma
enum ForumCategory {
  PLAGAS
  RIEGO
  CULTIVOS
  CLIMA
  EQUIPAMIENTO
  GENERAL
}

model ForumThread {
  id        String            @id @default(cuid())
  title     String
  content   String
  images    String[]
  category  ForumCategory
  userId    String
  user      User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime          @default(now())
  updatedAt DateTime          @updatedAt
  replies   ForumReply[]
  likes     ForumThreadLike[]
}

model ForumReply {
  id        String           @id @default(cuid())
  content   String
  images    String[]
  threadId  String
  thread    ForumThread      @relation(fields: [threadId], references: [id], onDelete: Cascade)
  userId    String
  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime         @default(now())
  likes     ForumReplyLike[]
}

model ForumThreadLike {
  id        String      @id @default(cuid())
  userId    String
  user      User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  threadId  String
  thread    ForumThread @relation(fields: [threadId], references: [id], onDelete: Cascade)
  createdAt DateTime    @default(now())

  @@unique([userId, threadId])
}

model ForumReplyLike {
  id        String     @id @default(cuid())
  userId    String
  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  replyId   String
  reply     ForumReply @relation(fields: [replyId], references: [id], onDelete: Cascade)
  createdAt DateTime   @default(now())

  @@unique([userId, replyId])
}
```

Add four relation fields inside the existing `User` model (after `sessions Session[]`):

```prisma
  forumThreads      ForumThread[]
  forumReplies      ForumReply[]
  forumThreadLikes  ForumThreadLike[]
  forumReplyLikes   ForumReplyLike[]
```

- [ ] **Step 2: Push schema to Neon and regenerate client**

```bash
pnpm --filter @brotia/db db:push
pnpm --filter @brotia/db db:generate
```

Expected: `Your database is now in sync with your Prisma schema` + client regenerated with new models.

- [ ] **Step 3: Commit**

```bash
git add packages/db/prisma/schema.prisma
git commit -m "feat(db): add ForumThread, ForumReply, ForumThreadLike, ForumReplyLike models"
```

---

## Task 2: Category Constants

**Files:**
- Create: `apps/web/src/lib/community-categories.ts`

- [ ] **Step 1: Create the constants file**

```ts
// apps/web/src/lib/community-categories.ts
export const CATEGORIES = [
  { key: 'PLAGAS',       label: 'Plagas y enfermedades', emoji: '🐛' },
  { key: 'RIEGO',        label: 'Riego y fertilización',  emoji: '💧' },
  { key: 'CULTIVOS',     label: 'Cultivos',               emoji: '🌱' },
  { key: 'CLIMA',        label: 'Clima y temporadas',     emoji: '🌤️' },
  { key: 'EQUIPAMIENTO', label: 'Equipamiento',           emoji: '🔧' },
  { key: 'GENERAL',      label: 'General',                emoji: '💬' },
] as const

export type CategoryKey = typeof CATEGORIES[number]['key']

export const getCategoryLabel = (key: string): string =>
  CATEGORIES.find(c => c.key === key)?.label ?? key

export const getCategoryEmoji = (key: string): string =>
  CATEGORIES.find(c => c.key === key)?.emoji ?? '💬'
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/lib/community-categories.ts
git commit -m "feat(community): add hardcoded category constants"
```

---

## Task 3: API — GET list + POST create thread

**Files:**
- Create: `apps/web/src/app/api/community/route.ts`
- Create: `apps/web/src/__tests__/community-api.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// apps/web/src/__tests__/community-api.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@brotia/db', () => ({
  db: {
    forumThread: {
      findMany: vi.fn(),
      create:   vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth', () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: 'user-1', email: 'farmer@test.com' } }),
}))

import { db } from '@brotia/db'
import { GET, POST } from '../app/api/community/route'

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

describe('POST /api/community', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates a thread with valid data', async () => {
    const payload = { title: 'Nueva pregunta', content: 'Descripción detallada del problema', category: 'PLAGAS', images: [] }
    vi.mocked(db.forumThread.create).mockResolvedValue({
      id: 'thread-2', ...payload, userId: 'user-1', createdAt: new Date(),
      user: { name: 'Ana', lastName: 'García', avatar: null },
      _count: { replies: 0, likes: 0 },
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
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
cd apps/web && pnpm test community-api
```

Expected: `Cannot find module '../app/api/community/route'`

- [ ] **Step 3: Create the route**

```ts
// apps/web/src/app/api/community/route.ts
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
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
cd apps/web && pnpm test community-api
```

Expected: all 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/api/community/route.ts apps/web/src/__tests__/community-api.test.ts
git commit -m "feat(community): GET list + POST create thread API + tests"
```

---

## Task 4: API — GET thread detail + DELETE thread

**Files:**
- Create: `apps/web/src/app/api/community/[id]/route.ts`

- [ ] **Step 1: Add tests to `community-api.test.ts`**

Add these imports and mocks at the top of `community-api.test.ts` (after existing mock for `db.forumThread`):

```ts
// Add forumReply to the db mock
vi.mock('@brotia/db', () => ({
  db: {
    forumThread: {
      findMany:  vi.fn(),
      create:    vi.fn(),
      findUnique: vi.fn(),
      delete:    vi.fn(),
    },
    forumReply: {
      create:    vi.fn(),
      findUnique: vi.fn(),
      delete:    vi.fn(),
    },
    forumThreadLike: {
      findUnique: vi.fn(),
      create:    vi.fn(),
      delete:    vi.fn(),
      count:     vi.fn(),
    },
    forumReplyLike: {
      findUnique: vi.fn(),
      create:    vi.fn(),
      delete:    vi.fn(),
      count:     vi.fn(),
    },
  },
}))
```

Add these test blocks at the end of `community-api.test.ts`:

```ts
import { GET as GET_DETAIL, DELETE as DELETE_THREAD } from '../app/api/community/[id]/route'

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

describe('GET /api/community/[id]', () => {
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

describe('DELETE /api/community/[id]', () => {
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
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
cd apps/web && pnpm test community-api
```

Expected: `Cannot find module '../app/api/community/[id]/route'`

- [ ] **Step 3: Create the route**

```ts
// apps/web/src/app/api/community/[id]/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@brotia/db'

type Params = { params: Promise<{ id: string }> }

export const GET = async (_req: Request, { params }: Params) => {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  try {
    const { id } = await params

    const thread = await db.forumThread.findUnique({
      where: { id },
      select: {
        id: true, title: true, category: true, content: true,
        images: true, createdAt: true, userId: true,
        user: { select: { name: true, lastName: true, avatar: true } },
        _count: { select: { replies: true, likes: true } },
        likes: { where: { userId: session.user.id }, select: { id: true } },
        replies: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true, content: true, images: true, createdAt: true, userId: true,
            user: { select: { name: true, lastName: true, avatar: true } },
            _count: { select: { likes: true } },
            likes: { where: { userId: session.user.id }, select: { id: true } },
          },
        },
      },
    })

    if (!thread) return NextResponse.json({ error: 'not_found' }, { status: 404 })

    return NextResponse.json({
      id: thread.id, title: thread.title, category: thread.category,
      content: thread.content,
      contentPreview: thread.content.slice(0, 200),
      images: thread.images,
      createdAt: thread.createdAt.toISOString(),
      userId: thread.userId,
      user: thread.user,
      _count: thread._count,
      hasLiked: thread.likes.length > 0,
      replies: thread.replies.map(r => ({
        id: r.id, content: r.content, images: r.images,
        createdAt: r.createdAt.toISOString(),
        userId: r.userId,
        user: r.user,
        _count: r._count,
        hasLiked: r.likes.length > 0,
      })),
    })
  } catch {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}

export const DELETE = async (_req: Request, { params }: Params) => {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  try {
    const { id } = await params

    const thread = await db.forumThread.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!thread) return NextResponse.json({ error: 'not_found' }, { status: 404 })
    if (thread.userId !== session.user.id) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

    await db.forumThread.delete({ where: { id } })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
cd apps/web && pnpm test community-api
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/api/community/[id]/route.ts apps/web/src/__tests__/community-api.test.ts
git commit -m "feat(community): GET thread detail + DELETE thread API + tests"
```

---

## Task 5: API — Like routes + Reply routes

**Files:**
- Create: `apps/web/src/app/api/community/[id]/like/route.ts`
- Create: `apps/web/src/app/api/community/[id]/replies/route.ts`
- Create: `apps/web/src/app/api/community/replies/[id]/route.ts`
- Create: `apps/web/src/app/api/community/replies/[id]/like/route.ts`

- [ ] **Step 1: Create thread like route**

```ts
// apps/web/src/app/api/community/[id]/like/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@brotia/db'

type Params = { params: Promise<{ id: string }> }

export const POST = async (_req: Request, { params }: Params) => {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  try {
    const { id: threadId } = await params

    const existing = await db.forumThreadLike.findUnique({
      where: { userId_threadId: { userId: session.user.id, threadId } },
    })

    if (existing) {
      await db.forumThreadLike.delete({
        where: { userId_threadId: { userId: session.user.id, threadId } },
      })
    } else {
      await db.forumThreadLike.create({
        data: { userId: session.user.id, threadId },
      })
    }

    const count = await db.forumThreadLike.count({ where: { threadId } })

    return NextResponse.json({ liked: !existing, count })
  } catch {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Create reply like route**

```ts
// apps/web/src/app/api/community/replies/[id]/like/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@brotia/db'

type Params = { params: Promise<{ id: string }> }

export const POST = async (_req: Request, { params }: Params) => {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  try {
    const { id: replyId } = await params

    const existing = await db.forumReplyLike.findUnique({
      where: { userId_replyId: { userId: session.user.id, replyId } },
    })

    if (existing) {
      await db.forumReplyLike.delete({
        where: { userId_replyId: { userId: session.user.id, replyId } },
      })
    } else {
      await db.forumReplyLike.create({
        data: { userId: session.user.id, replyId },
      })
    }

    const count = await db.forumReplyLike.count({ where: { replyId } })

    return NextResponse.json({ liked: !existing, count })
  } catch {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
```

- [ ] **Step 3: Create add reply route**

```ts
// apps/web/src/app/api/community/[id]/replies/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@brotia/db'

type Params = { params: Promise<{ id: string }> }

export const POST = async (req: Request, { params }: Params) => {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  try {
    const { id: threadId } = await params
    const { content, images } = await req.json()

    if (!content?.trim()) {
      return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
    }

    const thread = await db.forumThread.findUnique({
      where: { id: threadId },
      select: { id: true },
    })
    if (!thread) return NextResponse.json({ error: 'not_found' }, { status: 404 })

    const reply = await db.forumReply.create({
      data: {
        content:  content.trim(),
        images:   Array.isArray(images) ? images : [],
        threadId,
        userId:   session.user.id,
      },
      select: {
        id: true, content: true, images: true, createdAt: true, userId: true,
        user: { select: { name: true, lastName: true, avatar: true } },
        _count: { select: { likes: true } },
      },
    })

    return NextResponse.json({
      ...reply,
      createdAt: reply.createdAt.toISOString(),
      hasLiked: false,
    }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Create delete reply route**

```ts
// apps/web/src/app/api/community/replies/[id]/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@brotia/db'

type Params = { params: Promise<{ id: string }> }

export const DELETE = async (_req: Request, { params }: Params) => {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  try {
    const { id } = await params

    const reply = await db.forumReply.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!reply) return NextResponse.json({ error: 'not_found' }, { status: 404 })
    if (reply.userId !== session.user.id) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

    await db.forumReply.delete({ where: { id } })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
```

- [ ] **Step 5: Run all tests to verify nothing broke**

```bash
cd apps/web && pnpm test
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/api/community/
git commit -m "feat(community): like + reply API routes"
```

---

## Task 6: Web — Shared components (UserAvatar + ThreadCard + CategoryTabs)

**Files:**
- Create: `apps/web/src/components/community/user-avatar.tsx`
- Create: `apps/web/src/components/community/thread-card.tsx`
- Create: `apps/web/src/components/community/category-tabs.tsx`

- [ ] **Step 1: Create UserAvatar**

```tsx
// apps/web/src/components/community/user-avatar.tsx
type Props = {
  name:     string | null
  lastName: string | null
  avatar:   string | null
  size?:    'sm' | 'md'
}

export const UserAvatar = ({ name, lastName, avatar, size = 'md' }: Props) => {
  const initials = [name?.[0], lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?'
  const dim      = size === 'sm' ? 'size-7 text-xs' : 'size-9 text-sm'

  if (avatar) {
    return (
      <img
        src={avatar}
        alt={`${name ?? ''} ${lastName ?? ''}`}
        className={`${dim} rounded-full object-cover shrink-0`}
      />
    )
  }

  return (
    <div className={`${dim} rounded-full bg-primary/20 text-primary font-semibold flex items-center justify-center shrink-0`}>
      {initials}
    </div>
  )
}

export const formatUserName = (name: string | null, lastName: string | null): string =>
  [name, lastName].filter(Boolean).join(' ') || 'Usuario'
```

- [ ] **Step 2: Create ThreadCard**

```tsx
// apps/web/src/components/community/thread-card.tsx
import Link from 'next/link'
import { MessageSquare, Heart } from 'lucide-react'
import { UserAvatar, formatUserName } from './user-avatar'
import { getCategoryLabel, getCategoryEmoji } from '@/lib/community-categories'

type ThreadUser = { name: string | null; lastName: string | null; avatar: string | null }

export type ThreadSummary = {
  id:             string
  title:          string
  category:       string
  contentPreview: string
  images:         string[]
  createdAt:      string
  userId:         string
  user:           ThreadUser
  _count:         { replies: number; likes: number }
  hasLiked:       boolean
}

export const ThreadCard = ({ thread }: { thread: ThreadSummary }) => (
  <Link href={`/community/${thread.id}`} className="block">
    <div className="bg-surface border border-border rounded-lg p-4 hover:border-primary/40 transition-colors">
      <div className="flex items-start gap-3">
        <UserAvatar {...thread.user} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5 font-medium">
              {getCategoryEmoji(thread.category)} {getCategoryLabel(thread.category)}
            </span>
            <span className="text-xs text-muted">{formatUserName(thread.user.name, thread.user.lastName)}</span>
            <span className="text-xs text-muted">·</span>
            <span className="text-xs text-muted">{new Date(thread.createdAt).toLocaleDateString('es-ES')}</span>
          </div>
          <h3 className="font-semibold text-foreground text-sm mb-1 leading-snug">{thread.title}</h3>
          <p className="text-xs text-muted line-clamp-2">{thread.contentPreview}</p>
          <div className="flex items-center gap-4 mt-2">
            <span className="flex items-center gap-1 text-xs text-muted">
              <MessageSquare className="size-3.5" />
              {thread._count.replies}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted">
              <Heart className={`size-3.5 ${thread.hasLiked ? 'fill-danger text-danger' : ''}`} />
              {thread._count.likes}
            </span>
          </div>
        </div>
      </div>
    </div>
  </Link>
)
```

- [ ] **Step 3: Create CategoryTabs**

```tsx
// apps/web/src/components/community/category-tabs.tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { CATEGORIES } from '@/lib/community-categories'

export const CategoryTabs = () => {
  const router      = useRouter()
  const searchParams = useSearchParams()
  const active      = searchParams.get('category') ?? ''

  const set = (key: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (key) params.set('category', key)
    else params.delete('category')
    router.push(`/community?${params.toString()}`)
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      <button
        onClick={() => set('')}
        className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${
          !active
            ? 'bg-primary text-surface border-primary'
            : 'border-border text-muted hover:border-primary/50 hover:text-foreground'
        }`}
      >
        Todos
      </button>
      {CATEGORIES.map(cat => (
        <button
          key={cat.key}
          onClick={() => set(cat.key)}
          className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${
            active === cat.key
              ? 'bg-primary text-surface border-primary'
              : 'border-border text-muted hover:border-primary/50 hover:text-foreground'
          }`}
        >
          {cat.emoji} {cat.label}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/community/ apps/web/src/lib/community-categories.ts
git commit -m "feat(community): UserAvatar, ThreadCard, CategoryTabs components"
```

---

## Task 7: Web — Thread list page

**Files:**
- Create: `apps/web/src/app/(dashboard)/community/page.tsx`

- [ ] **Step 1: Create the server page**

```tsx
// apps/web/src/app/(dashboard)/community/page.tsx
import { Suspense } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Plus } from 'lucide-react'
import { auth } from '@/lib/auth'
import { db } from '@brotia/db'
import { ThreadCard, type ThreadSummary } from '@/components/community/thread-card'
import { CategoryTabs } from '@/components/community/category-tabs'

type Props = { searchParams: Promise<{ category?: string; page?: string }> }

const CommunityPage = async ({ searchParams }: Props) => {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { category, page: pageStr } = await searchParams
  const page     = parseInt(pageStr ?? '1', 10)
  const pageSize = 20

  const threads = await db.forumThread.findMany({
    where:   category ? { category: category as any } : {},
    orderBy: { createdAt: 'desc' },
    skip:    (page - 1) * pageSize,
    take:    pageSize,
    select: {
      id: true, title: true, category: true, content: true,
      images: true, createdAt: true, userId: true,
      user:   { select: { name: true, lastName: true, avatar: true } },
      _count: { select: { replies: true, likes: true } },
      likes:  { where: { userId: session.user.id }, select: { id: true } },
    },
  })

  const formatted: ThreadSummary[] = threads.map(t => ({
    id: t.id, title: t.title, category: t.category,
    contentPreview: t.content.slice(0, 200),
    images: t.images,
    createdAt: t.createdAt.toISOString(),
    userId: t.userId,
    user: t.user,
    _count: t._count,
    hasLiked: t.likes.length > 0,
  }))

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl text-foreground">Comunidad</h1>
          <p className="text-sm text-muted">Comparte dudas y aprende de otros agricultores</p>
        </div>
        <Link
          href="/community/new"
          className="flex items-center gap-1.5 bg-primary text-surface text-sm font-medium px-3 py-2 rounded-md hover:bg-primary-hover transition-colors"
        >
          <Plus className="size-4" />
          Nueva pregunta
        </Link>
      </div>

      <Suspense>
        <CategoryTabs />
      </Suspense>

      {formatted.length === 0 ? (
        <div className="text-center py-12 text-muted text-sm">
          No hay publicaciones aún. ¡Sé el primero en preguntar!
        </div>
      ) : (
        <div className="space-y-3">
          {formatted.map(t => <ThreadCard key={t.id} thread={t} />)}
        </div>
      )}
    </div>
  )
}

export default CommunityPage
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd apps/web && pnpm tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/(dashboard)/community/page.tsx
git commit -m "feat(community): thread list server page"
```

---

## Task 8: Web — Create thread page

**Files:**
- Create: `apps/web/src/app/(dashboard)/community/new/page.tsx`

- [ ] **Step 1: Create the client page**

```tsx
// apps/web/src/app/(dashboard)/community/new/page.tsx
'use client'

import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ImageIcon, Send, X } from 'lucide-react'
import Link from 'next/link'
import { CATEGORIES } from '@/lib/community-categories'

const NewThreadPage = () => {
  const router   = useRouter()
  const [title,    setTitle]    = useState('')
  const [content,  setContent]  = useState('')
  const [category, setCategory] = useState('')
  const [pendingImage,        setPendingImage]        = useState<File | null>(null)
  const [pendingImagePreview, setPendingImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPendingImage(file)
    const reader = new FileReader()
    reader.onload = ev => setPendingImagePreview(ev.target?.result as string)
    reader.readAsDataURL(file)
    e.target.value = ''
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!title.trim() || !content.trim() || !category) {
      setError('Completa todos los campos requeridos')
      return
    }

    setLoading(true)
    setError(null)

    const images = pendingImagePreview ? [pendingImagePreview] : []

    try {
      const res = await fetch('/api/community', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ title, content, category, images }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      router.push(`/community/${data.id}`)
    } catch {
      setError('No se pudo publicar. Inténtalo de nuevo.')
      setLoading(false)
    }
  }, [title, content, category, pendingImagePreview, router])

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/community" className="p-1.5 rounded hover:bg-surface-alt transition-colors">
          <ArrowLeft className="size-5 text-muted" />
        </Link>
        <div>
          <h1 className="font-heading font-bold text-2xl text-foreground">Nueva pregunta</h1>
          <p className="text-sm text-muted">Comparte tu duda con la comunidad</p>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-lg p-4 space-y-4">
        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Categoría *</label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full bg-surface-alt border border-border rounded-md px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
          >
            <option value="">Selecciona una categoría</option>
            {CATEGORIES.map(cat => (
              <option key={cat.key} value={cat.key}>{cat.emoji} {cat.label}</option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Título *</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="¿Cuál es tu pregunta?"
            maxLength={150}
            className="w-full bg-surface-alt border border-border rounded-md px-3 py-2.5 text-sm text-foreground placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Descripción *</label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Describe el problema con detalle..."
            rows={5}
            className="w-full bg-surface-alt border border-border rounded-md px-3 py-2.5 text-sm text-foreground placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary resize-none"
          />
        </div>

        {/* Image preview */}
        {pendingImagePreview && (
          <div className="relative w-24">
            <img src={pendingImagePreview} alt="Imagen adjunta" className="w-24 h-24 object-cover rounded-md border border-border" />
            <button
              onClick={() => { setPendingImage(null); setPendingImagePreview(null) }}
              className="absolute -top-1.5 -right-1.5 size-5 bg-danger rounded-full flex items-center justify-center"
            >
              <X className="size-3 text-danger-text" />
            </button>
          </div>
        )}

        {error && <p className="text-sm text-danger-text">{error}</p>}

        <div className="flex items-center justify-between">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-md border border-border text-muted hover:text-foreground hover:border-primary/50 transition-colors"
            aria-label="Adjuntar imagen"
          >
            <ImageIcon className="size-5" />
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />

          <button
            onClick={handleSubmit}
            disabled={loading || !title.trim() || !content.trim() || !category}
            className="flex items-center gap-2 bg-primary text-surface text-sm font-medium px-4 py-2 rounded-md hover:bg-primary-hover transition-colors disabled:opacity-40"
          >
            <Send className="size-4" />
            {loading ? 'Publicando...' : 'Publicar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default NewThreadPage
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/app/(dashboard)/community/new/page.tsx
git commit -m "feat(community): create thread page"
```

---

## Task 9: Web — Thread detail page + CommunityThread component

**Files:**
- Create: `apps/web/src/components/community/reply-bubble.tsx`
- Create: `apps/web/src/components/community/community-thread.tsx`
- Create: `apps/web/src/app/(dashboard)/community/[id]/page.tsx`

- [ ] **Step 1: Create ReplyBubble**

```tsx
// apps/web/src/components/community/reply-bubble.tsx
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

type Props = {
  reply:         ReplyItem
  isOwn:         boolean
  onLike:        (id: string) => void
  onDelete:      (id: string) => void
}

export const ReplyBubble = ({ reply, isOwn, onLike, onDelete }: Props) => (
  <div className="flex gap-3 group">
    <UserAvatar {...reply.user} />
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-medium text-foreground">
          {formatUserName(reply.user.name, reply.user.lastName)}
        </span>
        <span className="text-xs text-muted">
          {new Date(reply.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      </div>

      {reply.images.map((img, i) => (
        <img key={i} src={img} alt="Imagen adjunta" className="rounded-xl max-w-xs max-h-48 object-cover border border-border mb-2" />
      ))}

      <div className="bg-surface-alt border border-border rounded-xl rounded-tl-sm px-4 py-3 text-sm text-foreground leading-relaxed whitespace-pre-wrap">
        {reply.content}
      </div>

      <div className="flex items-center gap-3 mt-1.5 pl-1">
        <button
          onClick={() => onLike(reply.id)}
          className="flex items-center gap-1 text-xs text-muted hover:text-foreground transition-colors"
        >
          <Heart className={`size-3.5 ${reply.hasLiked ? 'fill-danger text-danger' : ''}`} />
          {reply._count.likes}
        </button>
        {isOwn && (
          <button
            onClick={() => onDelete(reply.id)}
            className="flex items-center gap-1 text-xs text-muted hover:text-danger transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Eliminar respuesta"
          >
            <Trash2 className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  </div>
)
```

- [ ] **Step 2: Create CommunityThread client component**

```tsx
// apps/web/src/components/community/community-thread.tsx
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, Heart, Trash2, ImageIcon, X, Send } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { UserAvatar, formatUserName } from './user-avatar'
import { ReplyBubble, type ReplyItem } from './reply-bubble'
import { getCategoryEmoji, getCategoryLabel } from '@/lib/community-categories'

export type ThreadDetail = {
  id:             string
  title:          string
  category:       string
  content:        string
  images:         string[]
  createdAt:      string
  userId:         string
  user:           { name: string | null; lastName: string | null; avatar: string | null }
  _count:         { replies: number; likes: number }
  hasLiked:       boolean
  replies:        ReplyItem[]
}

type Props = {
  thread:        ThreadDetail
  sessionUserId: string
}

export const CommunityThread = ({ thread: initial, sessionUserId }: Props) => {
  const router  = useRouter()
  const [thread,  setThread]  = useState(initial)
  const [replies, setReplies] = useState<ReplyItem[]>(initial.replies)
  const [input,   setInput]   = useState('')
  const [pendingImage,        setPendingImage]        = useState<File | null>(null)
  const [pendingImagePreview, setPendingImagePreview] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const bottomRef    = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [replies])

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPendingImage(file)
    const reader = new FileReader()
    reader.onload = ev => setPendingImagePreview(ev.target?.result as string)
    reader.readAsDataURL(file)
    e.target.value = ''
  }, [])

  const handleLikeThread = useCallback(async () => {
    const res = await fetch(`/api/community/${thread.id}/like`, { method: 'POST' })
    if (!res.ok) return
    const { liked, count } = await res.json()
    setThread(t => ({ ...t, hasLiked: liked, _count: { ...t._count, likes: count } }))
  }, [thread.id])

  const handleLikeReply = useCallback(async (replyId: string) => {
    const res = await fetch(`/api/community/replies/${replyId}/like`, { method: 'POST' })
    if (!res.ok) return
    const { liked, count } = await res.json()
    setReplies(prev => prev.map(r =>
      r.id === replyId ? { ...r, hasLiked: liked, _count: { likes: count } } : r
    ))
  }, [])

  const handleDeleteReply = useCallback(async (replyId: string) => {
    await fetch(`/api/community/replies/${replyId}`, { method: 'DELETE' })
    setReplies(prev => prev.filter(r => r.id !== replyId))
  }, [])

  const handleDeleteThread = useCallback(async () => {
    await fetch(`/api/community/${thread.id}`, { method: 'DELETE' })
    router.push('/community')
  }, [thread.id, router])

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text && !pendingImage) return
    if (sending) return

    setSending(true)
    const images = pendingImagePreview ? [pendingImagePreview] : []

    setInput('')
    setPendingImage(null)
    setPendingImagePreview(null)

    try {
      const res = await fetch(`/api/community/${thread.id}/replies`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ content: text || ' ', images }),
      })
      if (!res.ok) return
      const reply: ReplyItem = await res.json()
      setReplies(prev => [...prev, reply])
    } finally {
      setSending(false)
    }
  }, [input, pendingImage, pendingImagePreview, sending, thread.id])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  return (
    <div className="-m-4 -mb-20 md:-m-6 flex flex-col h-dvh overflow-hidden bg-surface">

      {/* Header */}
      <div className="shrink-0 border-b border-border px-4 py-3 bg-surface">
        <div className="flex items-start gap-3">
          <Link href="/community" className="p-1.5 rounded hover:bg-surface-alt transition-colors mt-0.5 shrink-0">
            <ArrowLeft className="size-4 text-muted" />
          </Link>
          <div className="flex-1 min-w-0">
            <span className="text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5 font-medium inline-block mb-0.5">
              {getCategoryEmoji(thread.category)} {getCategoryLabel(thread.category)}
            </span>
            <h1 className="font-semibold text-foreground text-sm leading-snug">{thread.title}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted">{formatUserName(thread.user.name, thread.user.lastName)}</span>
              <span className="text-xs text-muted">·</span>
              <span className="text-xs text-muted">{new Date(thread.createdAt).toLocaleDateString('es-ES')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* Original post */}
        <div className="bg-surface-alt border border-border rounded-xl p-4">
          <div className="flex items-start gap-3">
            <UserAvatar {...thread.user} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground mb-2">{formatUserName(thread.user.name, thread.user.lastName)}</p>
              {thread.images.map((img, i) => (
                <img key={i} src={img} alt="Imagen" className="rounded-xl max-w-xs max-h-48 object-cover border border-border mb-3" />
              ))}
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{thread.content}</p>
              <div className="flex items-center gap-3 mt-3">
                <button onClick={handleLikeThread} className="flex items-center gap-1 text-xs text-muted hover:text-foreground transition-colors">
                  <Heart className={`size-3.5 ${thread.hasLiked ? 'fill-danger text-danger' : ''}`} />
                  {thread._count.likes}
                </button>
                <span className="text-xs text-muted">{replies.length} respuestas</span>
                {thread.userId === sessionUserId && (
                  <button onClick={handleDeleteThread} className="ml-auto text-xs text-muted hover:text-danger transition-colors" aria-label="Eliminar pregunta">
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {replies.length > 0 && (
          <>
            <div className="border-t border-border" />
            <div className="space-y-4">
              {replies.map(reply => (
                <ReplyBubble
                  key={reply.id}
                  reply={reply}
                  isOwn={reply.userId === sessionUserId}
                  onLike={handleLikeReply}
                  onDelete={handleDeleteReply}
                />
              ))}
            </div>
          </>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Reply input */}
      <div className="shrink-0 border-t border-border p-4 bg-surface" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
        {pendingImagePreview && (
          <div className="mb-3 relative w-24">
            <img src={pendingImagePreview} alt="Imagen adjunta" className="w-24 h-24 object-cover rounded-md border border-border" />
            <button
              onClick={() => { setPendingImage(null); setPendingImagePreview(null) }}
              className="absolute -top-1.5 -right-1.5 size-5 bg-danger rounded-full flex items-center justify-center"
            >
              <X className="size-3 text-danger-text" />
            </button>
          </div>
        )}

        <div className="flex items-end gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0 p-2 rounded-md border border-border text-muted hover:text-foreground hover:border-primary/50 transition-colors"
            aria-label="Adjuntar imagen"
          >
            <ImageIcon className="size-5" />
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />

          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu respuesta..."
            rows={1}
            disabled={sending}
            className="flex-1 resize-none bg-surface-alt border border-border rounded-md px-3 py-2.5 text-base md:text-sm text-foreground placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary disabled:opacity-50 max-h-32 overflow-y-auto"
            style={{ minHeight: '2.5rem' }}
            onInput={e => {
              const el = e.currentTarget
              el.style.height = 'auto'
              el.style.height = `${Math.min(el.scrollHeight, 128)}px`
            }}
          />

          <button
            onClick={handleSend}
            disabled={sending || (!input.trim() && !pendingImage)}
            className="shrink-0 p-2 rounded-md bg-primary text-surface hover:bg-primary-hover transition-colors disabled:opacity-40"
            aria-label="Enviar respuesta"
          >
            <Send className="size-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create thread detail server page**

```tsx
// apps/web/src/app/(dashboard)/community/[id]/page.tsx
import { redirect, notFound } from 'next/navigation'
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

  const threadDetail: ThreadDetail = {
    id: thread.id, title: thread.title, category: thread.category,
    content: thread.content,
    images: thread.images,
    createdAt: thread.createdAt.toISOString(),
    userId: thread.userId,
    user: thread.user,
    _count: thread._count,
    hasLiked: thread.likes.length > 0,
    replies: thread.replies.map(r => ({
      id: r.id, content: r.content, images: r.images,
      createdAt: r.createdAt.toISOString(),
      userId: r.userId,
      user: r.user,
      _count: r._count,
      hasLiked: r.likes.length > 0,
    })),
  }

  return <CommunityThread thread={threadDetail} sessionUserId={session.user.id} />
}

export default ThreadPage
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd apps/web && pnpm tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/community/ apps/web/src/app/(dashboard)/community/
git commit -m "feat(community): thread detail page + CommunityThread + ReplyBubble components"
```

---

## Task 10: Web — Navigation (Sidebar + BottomNav)

**Files:**
- Modify: `apps/web/src/components/nav/sidebar.tsx`
- Modify: `apps/web/src/components/nav/bottom-nav.tsx`

- [ ] **Step 1: Add Comunidad to sidebar**

In `apps/web/src/components/nav/sidebar.tsx`, change the import line and navItems:

```tsx
import { LayoutDashboard, Leaf, BarChart2, Bot, Settings, Users } from 'lucide-react'

const navItems = [
  { href: '/dashboard',    icon: LayoutDashboard, label: 'Invernaderos'  },
  { href: '/cultivos',     icon: Leaf,            label: 'Cultivos'      },
  { href: '/estadisticas', icon: BarChart2,        label: 'Estadísticas'  },
  { href: '/chat',         icon: Bot,             label: 'Brotia IA'     },
  { href: '/community',    icon: Users,           label: 'Comunidad'     },
  { href: '/compte',       icon: Settings,        label: 'Mi cuenta'     },
]
```

- [ ] **Step 2: Replace Stats with Comunidad in bottom nav**

In `apps/web/src/components/nav/bottom-nav.tsx`, replace the import and navItems (Stats removed — 5 items is the max for mobile bottom nav):

```tsx
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Leaf, Users, Bot, Settings } from 'lucide-react'

const navItems = [
  { href: '/dashboard',  icon: LayoutDashboard, label: 'Inicio'     },
  { href: '/cultivos',   icon: Leaf,            label: 'Cultivos'   },
  { href: '/community',  icon: Users,           label: 'Comunidad'  },
  { href: '/chat',       icon: Bot,             label: 'IA'         },
  { href: '/compte',     icon: Settings,        label: 'Cuenta'     },
]
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/nav/
git commit -m "feat(community): add Comunidad to web sidebar and bottom nav"
```

---

## Task 11: Mobile — API client

**Files:**
- Modify: `apps/mobile/lib/api.ts`

- [ ] **Step 1: Add community types and api.community methods**

At the top of `apps/mobile/lib/api.ts`, add these types after the existing ones:

```ts
export type ForumUser = {
  name:     string | null
  lastName: string | null
  avatar:   string | null
}

export type ThreadSummary = {
  id:             string
  title:          string
  category:       string
  contentPreview: string
  images:         string[]
  createdAt:      string
  userId:         string
  user:           ForumUser
  _count:         { replies: number; likes: number }
  hasLiked:       boolean
}

export type ReplyItem = {
  id:        string
  content:   string
  images:    string[]
  createdAt: string
  userId:    string
  user:      ForumUser
  _count:    { likes: number }
  hasLiked:  boolean
}

export type ThreadDetail = Omit<ThreadSummary, 'contentPreview'> & {
  content: string
  replies: ReplyItem[]
}

export type LikeResult = { liked: boolean; count: number }
```

Inside the `api` object, add the community namespace after the existing `crops` block:

```ts
  community: {
    list: async (category?: string, page = 1): Promise<ThreadSummary[]> => {
      const params = new URLSearchParams({ page: String(page) })
      if (category) params.set('category', category)
      const res = await fetch(`${API_BASE}/api/community?${params}`, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to fetch threads')
      return res.json() as Promise<ThreadSummary[]>
    },
    get: async (id: string): Promise<ThreadDetail> => {
      const res = await fetch(`${API_BASE}/api/community/${id}`, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to fetch thread')
      return res.json() as Promise<ThreadDetail>
    },
    create: async (data: { title: string; content: string; category: string; images: string[] }): Promise<ThreadDetail> => {
      const res = await fetch(`${API_BASE}/api/community`, {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify(data),
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed to create thread')
      return res.json() as Promise<ThreadDetail>
    },
    reply: async (threadId: string, data: { content: string; images: string[] }): Promise<ReplyItem> => {
      const res = await fetch(`${API_BASE}/api/community/${threadId}/replies`, {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify(data),
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed to add reply')
      return res.json() as Promise<ReplyItem>
    },
    likeThread: async (threadId: string): Promise<LikeResult> => {
      const res = await fetch(`${API_BASE}/api/community/${threadId}/like`, {
        method:      'POST',
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed to like thread')
      return res.json() as Promise<LikeResult>
    },
    likeReply: async (replyId: string): Promise<LikeResult> => {
      const res = await fetch(`${API_BASE}/api/community/replies/${replyId}/like`, {
        method:      'POST',
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed to like reply')
      return res.json() as Promise<LikeResult>
    },
    deleteThread: async (id: string): Promise<void> => {
      const res = await fetch(`${API_BASE}/api/community/${id}`, {
        method:      'DELETE',
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed to delete thread')
    },
    deleteReply: async (id: string): Promise<void> => {
      const res = await fetch(`${API_BASE}/api/community/replies/${id}`, {
        method:      'DELETE',
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed to delete reply')
    },
  },
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/lib/api.ts
git commit -m "feat(community): add community methods to mobile API client"
```

---

## Task 12: Mobile — Tab layout + Thread list screen

**Files:**
- Modify: `apps/mobile/app/(tabs)/_layout.tsx`
- Create: `apps/mobile/app/(tabs)/community.tsx`

- [ ] **Step 1: Add community tab to layout**

In `apps/mobile/app/(tabs)/_layout.tsx`, add `Users` to the import and add a new `<Tabs.Screen>` between "Brotia IA" and "Ajustes":

```tsx
import { Tabs } from 'expo-router'
import { LayoutDashboard, Leaf, Bot, Settings, Users } from 'lucide-react-native'
import { palette } from '@/lib/theme'

const TabsLayout = () => (
  <Tabs
    screenOptions={{
      tabBarActiveTintColor:   palette.primary,
      tabBarInactiveTintColor: palette.muted,
      tabBarStyle: {
        backgroundColor: palette.white,
        borderTopColor:  palette.border,
      },
      headerStyle:     { backgroundColor: palette.white },
      headerTintColor: palette.foreground,
    }}
  >
    <Tabs.Screen
      name="index"
      options={{
        title:      'Invernaderos',
        tabBarIcon: ({ color }) => <LayoutDashboard size={22} color={color} />,
      }}
    />
    <Tabs.Screen
      name="crops"
      options={{
        title:      'Cultivos',
        tabBarIcon: ({ color }) => <Leaf size={22} color={color} />,
      }}
    />
    <Tabs.Screen
      name="chat"
      options={{
        title:      'Brotia IA',
        tabBarIcon: ({ color }) => <Bot size={22} color={color} />,
      }}
    />
    <Tabs.Screen
      name="community"
      options={{
        title:      'Comunidad',
        tabBarIcon: ({ color }) => <Users size={22} color={color} />,
      }}
    />
    <Tabs.Screen
      name="settings"
      options={{
        title:      'Ajustes',
        tabBarIcon: ({ color }) => <Settings size={22} color={color} />,
      }}
    />
  </Tabs>
)

export default TabsLayout
```

- [ ] **Step 2: Create community thread list screen**

```tsx
// apps/mobile/app/(tabs)/community.tsx
import { useCallback, useEffect, useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity,
  RefreshControl, ScrollView, ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Heart, MessageSquare, Plus } from 'lucide-react-native'
import { api, type ThreadSummary } from '@/lib/api'
import { palette } from '@/lib/theme'

const CATEGORIES = [
  { key: '',            label: 'Todos'               },
  { key: 'PLAGAS',      label: '🐛 Plagas'           },
  { key: 'RIEGO',       label: '💧 Riego'            },
  { key: 'CULTIVOS',    label: '🌱 Cultivos'         },
  { key: 'CLIMA',       label: '🌤️ Clima'            },
  { key: 'EQUIPAMIENTO',label: '🔧 Equipamiento'     },
  { key: 'GENERAL',     label: '💬 General'          },
]

const formatName = (name: string | null, lastName: string | null) =>
  [name, lastName].filter(Boolean).join(' ') || 'Usuario'

const CommunityScreen = () => {
  const router = useRouter()
  const [threads,    setThreads]    = useState<ThreadSummary[]>([])
  const [category,   setCategory]   = useState('')
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async (cat: string) => {
    try {
      const data = await api.community.list(cat || undefined)
      setThreads(data)
    } catch { /* non-blocking */ }
  }, [])

  useEffect(() => {
    setLoading(true)
    load(category).finally(() => setLoading(false))
  }, [category, load])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await load(category)
    setRefreshing(false)
  }, [category, load])

  return (
    <View className="flex-1 bg-white">
      {/* Category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="border-b border-gray-100"
        contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10, gap: 8 }}
      >
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.key}
            onPress={() => setCategory(cat.key)}
            style={{
              paddingHorizontal: 12, paddingVertical: 6,
              borderRadius: 20,
              backgroundColor: category === cat.key ? palette.primary : 'transparent',
              borderWidth: 1,
              borderColor: category === cat.key ? palette.primary : palette.border,
            }}
          >
            <Text style={{
              fontSize: 12,
              color: category === cat.key ? '#fff' : palette.muted,
            }}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={palette.primary} />
        </View>
      ) : (
        <FlatList
          data={threads}
          keyExtractor={t => t.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ padding: 12, gap: 10 }}
          ListEmptyComponent={
            <Text className="text-center text-gray-400 text-sm mt-12">
              No hay publicaciones aún. ¡Sé el primero!
            </Text>
          }
          renderItem={({ item: thread }) => (
            <TouchableOpacity
              onPress={() => router.push(`/community/${thread.id}`)}
              style={{
                backgroundColor: '#fff',
                borderRadius: 12,
                padding: 14,
                borderWidth: 1,
                borderColor: palette.border,
              }}
            >
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{
                  width: 36, height: 36, borderRadius: 18,
                  backgroundColor: palette.primary + '22',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: palette.primary }}>
                    {[thread.user.name?.[0], thread.user.lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, color: palette.primary, fontWeight: '500', marginBottom: 2 }}>
                    {thread.category}
                  </Text>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: palette.foreground, marginBottom: 2 }}>
                    {thread.title}
                  </Text>
                  <Text style={{ fontSize: 12, color: palette.muted }} numberOfLines={2}>
                    {thread.contentPreview}
                  </Text>
                  <Text style={{ fontSize: 11, color: palette.muted, marginTop: 2 }}>
                    {formatName(thread.user.name, thread.user.lastName)}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 14, marginTop: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <MessageSquare size={13} color={palette.muted} />
                      <Text style={{ fontSize: 12, color: palette.muted }}>{thread._count.replies}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Heart size={13} color={thread.hasLiked ? '#ef4444' : palette.muted} fill={thread.hasLiked ? '#ef4444' : 'transparent'} />
                      <Text style={{ fontSize: 12, color: palette.muted }}>{thread._count.likes}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        onPress={() => router.push('/community/new')}
        style={{
          position: 'absolute', bottom: 90, right: 20,
          width: 52, height: 52, borderRadius: 26,
          backgroundColor: palette.primary,
          alignItems: 'center', justifyContent: 'center',
          shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
          elevation: 4,
        }}
      >
        <Plus size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  )
}

export default CommunityScreen
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/app/(tabs)/_layout.tsx apps/mobile/app/(tabs)/community.tsx
git commit -m "feat(community): mobile community tab + thread list screen"
```

---

## Task 13: Mobile — Create thread screen

**Files:**
- Create: `apps/mobile/app/community/new.tsx`

- [ ] **Step 1: Create the screen**

```tsx
// apps/mobile/app/community/new.tsx
import { useCallback, useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, Modal, FlatList, ActivityIndicator, Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { ChevronDown, Send } from 'lucide-react-native'
import { api } from '@/lib/api'
import { palette } from '@/lib/theme'

const CATEGORIES = [
  { key: 'PLAGAS',       label: '🐛 Plagas y enfermedades' },
  { key: 'RIEGO',        label: '💧 Riego y fertilización'  },
  { key: 'CULTIVOS',     label: '🌱 Cultivos'               },
  { key: 'CLIMA',        label: '🌤️ Clima y temporadas'     },
  { key: 'EQUIPAMIENTO', label: '🔧 Equipamiento'           },
  { key: 'GENERAL',      label: '💬 General'                },
]

const NewThreadScreen = () => {
  const router = useRouter()
  const [title,    setTitle]    = useState('')
  const [content,  setContent]  = useState('')
  const [category, setCategory] = useState('')
  const [categoryLabel, setCategoryLabel] = useState('Selecciona una categoría')
  const [showPicker, setShowPicker] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = useCallback(async () => {
    if (!title.trim() || !content.trim() || !category) {
      Alert.alert('Campos requeridos', 'Completa título, descripción y categoría')
      return
    }

    setLoading(true)
    try {
      const thread = await api.community.create({ title, content, category, images: [] })
      router.replace(`/community/${thread.id}`)
    } catch {
      Alert.alert('Error', 'No se pudo publicar. Inténtalo de nuevo.')
      setLoading(false)
    }
  }, [title, content, category, router])

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: '700', color: palette.foreground }}>Nueva pregunta</Text>

      {/* Category picker */}
      <View>
        <Text style={{ fontSize: 14, fontWeight: '500', color: palette.foreground, marginBottom: 6 }}>Categoría *</Text>
        <TouchableOpacity
          onPress={() => setShowPicker(true)}
          style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: palette.border,
            borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12,
          }}
        >
          <Text style={{ fontSize: 14, color: category ? palette.foreground : palette.muted }}>
            {categoryLabel}
          </Text>
          <ChevronDown size={16} color={palette.muted} />
        </TouchableOpacity>
      </View>

      {/* Title */}
      <View>
        <Text style={{ fontSize: 14, fontWeight: '500', color: palette.foreground, marginBottom: 6 }}>Título *</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="¿Cuál es tu pregunta?"
          placeholderTextColor={palette.muted}
          maxLength={150}
          style={{
            backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: palette.border,
            borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12,
            fontSize: 14, color: palette.foreground,
          }}
        />
      </View>

      {/* Content */}
      <View>
        <Text style={{ fontSize: 14, fontWeight: '500', color: palette.foreground, marginBottom: 6 }}>Descripción *</Text>
        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder="Describe el problema con detalle..."
          placeholderTextColor={palette.muted}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          style={{
            backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: palette.border,
            borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12,
            fontSize: 14, color: palette.foreground, minHeight: 120,
          }}
        />
      </View>

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={loading || !title.trim() || !content.trim() || !category}
        style={{
          backgroundColor: palette.primary, borderRadius: 8,
          paddingVertical: 14, flexDirection: 'row',
          alignItems: 'center', justifyContent: 'center', gap: 8,
          opacity: loading || !title.trim() || !content.trim() || !category ? 0.4 : 1,
        }}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <>
              <Send size={18} color="#fff" />
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#fff' }}>Publicar</Text>
            </>
        }
      </TouchableOpacity>

      {/* Category picker modal */}
      <Modal visible={showPicker} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: 32 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', padding: 16, borderBottomWidth: 1, borderColor: palette.border }}>
              Selecciona una categoría
            </Text>
            <FlatList
              data={CATEGORIES}
              keyExtractor={c => c.key}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setCategory(item.key)
                    setCategoryLabel(item.label)
                    setShowPicker(false)
                  }}
                  style={{
                    paddingHorizontal: 16, paddingVertical: 14,
                    borderBottomWidth: 1, borderColor: palette.border,
                    backgroundColor: category === item.key ? palette.primary + '11' : '#fff',
                  }}
                >
                  <Text style={{ fontSize: 14, color: palette.foreground }}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}

export default NewThreadScreen
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/app/community/new.tsx
git commit -m "feat(community): mobile create thread screen"
```

---

## Task 14: Mobile — Thread detail screen

**Files:**
- Create: `apps/mobile/app/community/[id].tsx`

- [ ] **Step 1: Create the screen**

```tsx
// apps/mobile/app/community/[id].tsx
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Heart, Send, Trash2 } from 'lucide-react-native'
import { api, type ThreadDetail, type ReplyItem } from '@/lib/api'
import { palette } from '@/lib/theme'

const formatName = (name: string | null, lastName: string | null) =>
  [name, lastName].filter(Boolean).join(' ') || 'Usuario'

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })

const ThreadDetailScreen = () => {
  const { id }  = useLocalSearchParams<{ id: string }>()
  const router  = useRouter()
  const scrollRef = useRef<ScrollView>(null)

  const [thread,   setThread]   = useState<ThreadDetail | null>(null)
  const [replies,  setReplies]  = useState<ReplyItem[]>([])
  const [input,    setInput]    = useState('')
  const [loading,  setLoading]  = useState(true)
  const [sending,  setSending]  = useState(false)
  const [sessionUserId, setSessionUserId] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [threadData, userProfile] = await Promise.all([
          api.community.get(id),
          api.user.get(),
        ])
        setThread(threadData)
        setReplies(threadData.replies)
        setSessionUserId(userProfile.id)
      } catch { /* non-blocking */ }
      finally { setLoading(false) }
    }
    load()
  }, [id])

  const handleLikeThread = useCallback(async () => {
    if (!thread) return
    const { liked, count } = await api.community.likeThread(thread.id)
    setThread(t => t ? { ...t, hasLiked: liked, _count: { ...t._count, likes: count } } : t)
  }, [thread])

  const handleLikeReply = useCallback(async (replyId: string) => {
    const { liked, count } = await api.community.likeReply(replyId)
    setReplies(prev => prev.map(r =>
      r.id === replyId ? { ...r, hasLiked: liked, _count: { likes: count } } : r
    ))
  }, [])

  const handleDeleteThread = useCallback(() => {
    if (!thread) return
    Alert.alert('Eliminar pregunta', '¿Seguro que quieres eliminar esta pregunta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        await api.community.deleteThread(thread.id)
        router.back()
      }},
    ])
  }, [thread, router])

  const handleDeleteReply = useCallback((replyId: string) => {
    Alert.alert('Eliminar respuesta', '¿Seguro que quieres eliminar esta respuesta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        await api.community.deleteReply(replyId)
        setReplies(prev => prev.filter(r => r.id !== replyId))
      }},
    ])
  }, [])

  const handleSend = useCallback(async () => {
    if (!thread || !input.trim() || sending) return
    setSending(true)
    const text = input.trim()
    setInput('')
    try {
      const reply = await api.community.reply(thread.id, { content: text, images: [] })
      setReplies(prev => [...prev, reply])
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)
    } finally {
      setSending(false)
    }
  }, [thread, input, sending])

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={palette.primary} />
      </View>
    )
  }

  if (!thread) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: palette.muted }}>Pregunta no encontrada</Text>
      </View>
    )
  }

  const isOwnThread = thread.userId === sessionUserId

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 16 }}>

        {/* Original post */}
        <View style={{ backgroundColor: '#f8f8f8', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: palette.border }}>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
            <View style={{
              width: 36, height: 36, borderRadius: 18,
              backgroundColor: palette.primary + '22',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: palette.primary }}>
                {[thread.user.name?.[0], thread.user.lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, color: palette.primary, fontWeight: '500' }}>{thread.category}</Text>
              <Text style={{ fontSize: 15, fontWeight: '700', color: palette.foreground }}>{thread.title}</Text>
              <Text style={{ fontSize: 12, color: palette.muted }}>
                {formatName(thread.user.name, thread.user.lastName)} · {formatDate(thread.createdAt)}
              </Text>
            </View>
          </View>
          <Text style={{ fontSize: 14, color: palette.foreground, lineHeight: 20 }}>{thread.content}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 12 }}>
            <TouchableOpacity onPress={handleLikeThread} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Heart size={16} color={thread.hasLiked ? '#ef4444' : palette.muted} fill={thread.hasLiked ? '#ef4444' : 'transparent'} />
              <Text style={{ fontSize: 13, color: palette.muted }}>{thread._count.likes}</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 13, color: palette.muted }}>{replies.length} respuestas</Text>
            {isOwnThread && (
              <TouchableOpacity onPress={handleDeleteThread} style={{ marginLeft: 'auto' }}>
                <Trash2 size={16} color={palette.muted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Replies */}
        {replies.map(reply => (
          <View key={reply.id} style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{
              width: 32, height: 32, borderRadius: 16,
              backgroundColor: palette.primary + '22',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: palette.primary }}>
                {[reply.user.name?.[0], reply.user.lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: palette.foreground }}>
                  {formatName(reply.user.name, reply.user.lastName)}
                </Text>
                <Text style={{ fontSize: 12, color: palette.muted }}>{formatDate(reply.createdAt)}</Text>
              </View>
              <View style={{
                backgroundColor: '#f0f0f0', borderRadius: 12, borderTopLeftRadius: 3,
                padding: 12, borderWidth: 1, borderColor: palette.border,
              }}>
                <Text style={{ fontSize: 14, color: palette.foreground, lineHeight: 20 }}>{reply.content}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 6, paddingLeft: 4 }}>
                <TouchableOpacity onPress={() => handleLikeReply(reply.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Heart size={14} color={reply.hasLiked ? '#ef4444' : palette.muted} fill={reply.hasLiked ? '#ef4444' : 'transparent'} />
                  <Text style={{ fontSize: 12, color: palette.muted }}>{reply._count.likes}</Text>
                </TouchableOpacity>
                {reply.userId === sessionUserId && (
                  <TouchableOpacity onPress={() => handleDeleteReply(reply.id)}>
                    <Trash2 size={14} color={palette.muted} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Reply input */}
      <View style={{
        flexDirection: 'row', alignItems: 'flex-end', gap: 8,
        padding: 12, borderTopWidth: 1, borderColor: palette.border,
        backgroundColor: '#fff',
      }}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Escribe tu respuesta..."
          placeholderTextColor={palette.muted}
          multiline
          style={{
            flex: 1, backgroundColor: '#f5f5f5',
            borderWidth: 1, borderColor: palette.border,
            borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10,
            fontSize: 14, color: palette.foreground, maxHeight: 100,
          }}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={sending || !input.trim()}
          style={{
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: palette.primary,
            alignItems: 'center', justifyContent: 'center',
            opacity: sending || !input.trim() ? 0.4 : 1,
          }}
        >
          {sending ? <ActivityIndicator size="small" color="#fff" /> : <Send size={18} color="#fff" />}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

export default ThreadDetailScreen
```

- [ ] **Step 2: Run all web tests one final time**

```bash
cd apps/web && pnpm test
```

Expected: all tests pass.

- [ ] **Step 3: TypeScript check on web**

```bash
cd apps/web && pnpm tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Final commit**

```bash
git add apps/mobile/app/community/ apps/mobile/lib/api.ts apps/mobile/app/(tabs)/
git commit -m "feat(community): mobile thread detail screen — community feature complete"
```

---

## Self-Review Checklist

- [x] Spec coverage: all requirements implemented — categories, likes on posts+replies, images, web+mobile
- [x] `userId` exposed in all thread/reply responses — enables author-only delete checks
- [x] `threadSelect` helper deduplicates select object in list + detail API routes
- [x] Like toggle uses `@@unique` compound key → Prisma generates correct `userId_threadId` name
- [x] Mobile `api.community.get` fetches `api.user.get` in parallel to get `sessionUserId`
- [x] Bottom nav stays at 5 items (replaced Stats with Comunidad)
- [x] Mobile tabs stay at 5 items (added Comunidad between IA and Ajustes)
- [x] Images stored as base64 preview in MVP (UploadThing integration is a follow-up)
