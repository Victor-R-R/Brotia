# Design Spec — /community Forum

**Date**: 2026-04-27  
**Status**: Approved  
**Scope**: Web (Next.js) + Mobile (Expo)

---

## Overview

A community forum where authenticated Brotia users can open discussion threads, reply to others, and like posts — all identified by their real name (`name + lastName`). No AI involved. The UI reuses patterns from the existing `/chat` feature to avoid code duplication.

---

## Requirements

- Users can create forum threads with a title, content, optional images, and a category
- Other users can reply to threads with content and optional images
- Both threads and replies support likes (toggle, unique per user)
- Users are identified by `name + lastName` (from their profile) + avatar
- Categories are predefined — no table in DB, enum in Prisma
- Feature ships on **web AND mobile** simultaneously
- Image upload uses UploadThing (already configured)
- Authentication required for all actions (read is also auth-gated, Brotia is a private SaaS)

---

## Categories (hardcoded enum)

```ts
enum ForumCategory {
  PLAGAS        // Plagas y enfermedades 🐛
  RIEGO         // Riego y fertilización 💧
  CULTIVOS      // Cultivos 🌱
  CLIMA         // Clima y temporadas 🌤️
  EQUIPAMIENTO  // Equipamiento 🔧
  GENERAL       // General 💬
}
```

---

## Database Schema (Prisma)

### New models

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

### User model additions (relations only)
```prisma
forumThreads      ForumThread[]
forumReplies      ForumReply[]
forumThreadLikes  ForumThreadLike[]
forumReplyLikes   ForumReplyLike[]
```

---

## API Routes (REST — shared by web and mobile)

All routes require authentication (`auth()` guard, 401 if unauthenticated).

### Threads

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/community` | List threads. Query: `?category=PLAGAS&page=1` | Required |
| POST | `/api/community` | Create thread `{ title, content, images[], category }` | Required |
| GET | `/api/community/[id]` | Thread detail + replies + like counts + `hasLiked` | Required |
| DELETE | `/api/community/[id]` | Delete thread (author only) | Required |
| POST | `/api/community/[id]/like` | Toggle like on thread → `{ liked, count }` | Required |

### Replies

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/community/[id]/replies` | Add reply `{ content, images[] }` | Required |
| DELETE | `/api/community/replies/[id]` | Delete reply (author only) | Required |
| POST | `/api/community/replies/[id]/like` | Toggle like on reply → `{ liked, count }` | Required |

### Response shapes

```ts
type ThreadSummary = {
  id: string
  title: string
  category: ForumCategory
  contentPreview: string   // first 200 chars — list view only
  images: string[]
  createdAt: string
  user: { name: string | null; lastName: string | null; avatar: string | null }
  _count: { replies: number; likes: number }
  hasLiked: boolean
}

type ThreadDetail = Omit<ThreadSummary, 'contentPreview'> & {
  content: string          // full content — thread detail only
  replies: ReplyItem[]
}
```

Pagination default: `pageSize = 20` threads per page.

type ReplyItem = {
  id: string
  content: string
  images: string[]
  createdAt: string
  user: { name: string | null; lastName: string | null; avatar: string | null }
  _count: { likes: number }
  hasLiked: boolean
}
```

---

## Web Pages

### `/community` — Thread list
- **Type**: Server Component
- Fetches threads directly from Prisma (no fetch to self)
- Renders category tabs (`Todos | Plagas | Riego | Cultivos | Clima | Equipamiento | General`)
- Active category driven by `?category=` search param (Next.js `searchParams`)
- Thread cards: title, category badge, author name, reply count, like count, content preview
- FAB / button: "Nueva pregunta" → navigates to `/community/new`

### `/community/new` — Create thread
- **Type**: Client Component (`'use client'`)
- Form: title (input), category (select), content (textarea), image upload (reuses existing pattern from `ChatInterface`)
- On submit: `POST /api/community` → redirect to `/community/[id]`

### `/community/[id]` — Thread detail
- **Type**: Server Component loads initial data → passes to `CommunityThread` Client Component
- `CommunityThread` is the core reusable component — mirrors `ChatInterface` layout:
  - Left sidebar: thread list (like conversations sidebar) — hidden on mobile, toggleable
  - Right area: thread header + replies as "messages" + reply input at bottom
- Reply input: same textarea + image upload pattern as `ChatInterface`
- Each reply bubble shows: `Nombre Apellido`, avatar circle with initials (if no avatar image), timestamp, content, images, like button
- Thread header shows: title, category badge, author, date, like button + count
- **No AI SDK** — plain `fetch` calls to add replies and toggle likes

### Code reuse strategy
- Extract `ImageUploadInput` from `ChatInterface` → shared component used in both chat and community new/reply forms
- `ReplyBubble` (adapted `MessageBubble`): removes AI bot avatar, adds user name + like button
- Textarea auto-resize logic: identical, inline in component

---

## Mobile (Expo)

### Navigation
- Add **5th tab**: "Comunidad" with `Users` icon from `lucide-react-native`
- Position: between "Brotia IA" and "Ajustes"

### Screens

#### `/(tabs)/community.tsx` — Thread list
- FlatList of thread cards
- Horizontal ScrollView at top for category filter chips
- Pull-to-refresh
- FAB "+" to navigate to `/community/new`

#### `/community/new.tsx` — Create thread
- TextInput for title
- Picker/select for category (native Modal or ActionSheet)
- TextInput multiline for content
- Image pick button (expo-image-picker)
- Submit button → POST → navigate back to list

#### `/community/[id].tsx` — Thread detail
- ScrollView with thread header + replies
- Sticky TextInput + send button at bottom (same pattern as mobile chat)
- Like button on thread and each reply (Heart icon, fill on liked)
- Shows author as "Nombre Apellido" or "Usuario" if null

### Mobile API client (`lib/api.ts` additions)
```ts
api.community.list(category?: string, page?: number)  → ThreadSummary[]
api.community.get(id: string)                          → ThreadDetail
api.community.create(data)                             → ThreadSummary
api.community.reply(threadId: string, data)            → ReplyItem
api.community.likeThread(threadId: string)             → { liked, count }
api.community.likeReply(replyId: string)               → { liked, count }
api.community.deleteThread(id: string)                 → void
api.community.deleteReply(id: string)                  → void
```

---

## Navigation Changes

### Web — Sidebar (`sidebar.tsx`)
Add item: `{ href: '/community', icon: Users, label: 'Comunidad' }` — between "Brotia IA" and "Mi cuenta".

### Mobile — Tabs layout (`app/(tabs)/_layout.tsx`)
Add `<Tabs.Screen name="community" ... />` with `Users` icon — 5th tab.

---

## Error Handling

- 401 on unauthenticated requests → redirect to login (web) / show alert (mobile)
- Author-only delete: 403 if `userId !== session.user.id`
- Image upload errors: show inline error, don't block form submission
- Like toggle: optimistic update on client, rollback on API error

---

## Out of Scope (MVP)

- Moderation / admin panel
- Notifications on new replies
- Nested replies (threads are flat)
- Search within forum
- Pinned/featured threads
- Editing posts or replies after creation
