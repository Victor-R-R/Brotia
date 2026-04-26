# Brotia — CLAUDE.md

AI context for the Brotia greenhouse management platform.

---

## I. Project overview

Brotia is a **greenhouse management SaaS** for farmers. Each user registers their greenhouses (GPS coords + area), tracks crops, takes field notes, and receives automated weather alerts based on real-time meteorological data.

**Monorepo** managed with Turborepo + pnpm workspaces.

```
brotia/
├── apps/
│   ├── web/          → Next.js 16 dashboard (primary app)
│   └── mobile/       → Expo 54 React Native companion
└── packages/
    ├── api/          → Zod schemas shared across apps
    ├── db/           → Prisma client + Neon adapter
    └── config/       → Shared TS / ESLint config
```

---

## II. Web app — apps/web

### Stack
- **Next.js 16** + **React 19** — App Router, server components by default
- **Tailwind CSS v4** with `@theme inline` (no `tailwind.config.ts`)
- **NextAuth v5** — Google OAuth + Resend email magic link
- **lucide-react** for icons throughout

### Route structure
```
/                          → Landing page (public)
/login                     → Auth page (Google + magic link)
/(dashboard)/              → Greenhouse list + map
/(dashboard)/greenhouse/new     → Create greenhouse form (client component)
/(dashboard)/greenhouse/[id]    → Greenhouse detail (weather, crops, notes, alerts)
/api/greenhouses           → GET list, POST create
/api/greenhouses/[id]      → GET, PUT, DELETE
/api/greenhouses/[id]/weather   → GET weather + alert check
/api/alerts/check          → POST — cron endpoint (Bearer CRON_SECRET)
/api/auth/[...nextauth]    → NextAuth handlers
```

### Pages planned but NOT yet built
The sidebar has links to `/cultivos`, `/chat`, `/ajustes` — these pages **do not exist yet**.

### Auth pattern (mandatory in every server page)
```ts
const session = await auth()
if (!session?.user?.id) redirect('/login')
```

### Critical Next.js 16 gotcha — params is a Promise
```ts
// CORRECT — params must be awaited in Next.js 16
type Props = { params: Promise<{ id: string }> }
const Page = async ({ params }: Props) => {
  const { id } = await params
  ...
}

// WRONG — params is not a plain object
const Page = async ({ params }: { params: { id: string } }) => { ... }
```

### MapLibre GL — always dynamic, always SSR:false
```ts
const GreenhouseMap = dynamic(
  () => import('@/components/greenhouse/greenhouse-map').then(m => m.GreenhouseMap),
  { ssr: false }
)
```
MapLibre runs in the browser only. Direct imports will break SSR.

### MapLibre map cleanup pattern
```ts
useEffect(() => {
  let cancelled = false
  let map: maplibregl.Map | null = null

  const init = async () => {
    const maplibre = await import('maplibre-gl')
    if (cancelled) return
    map = new maplibre.Map({ ... })
  }

  init()
  return () => {
    cancelled = true   // prevents init from running after unmount
    map?.remove()
  }
}, [markers, onSelect])
```

### Dashboard layout
Sidebar (`w-60`) + main content area. Nav items:
- `LayoutDashboard` → `/` (Invernaderos)
- `Leaf` → `/cultivos` (not built)
- `Bot` → `/chat` (not built)
- `Settings` → `/ajustes` (not built)

---

## III. Design system

Tailwind v4 — all custom tokens are CSS variables defined in `src/app/globals.css` via `@theme inline`.
**Never use arbitrary values** (`[#hex]`, `[40px]`) — always use token classes.

### Color tokens

| Token class | Use |
|---|---|
| `bg-background` | App background (dark) |
| `bg-surface` | Card / panel background |
| `bg-surface-alt` | Hover states, input backgrounds |
| `text-foreground` | Primary text |
| `text-muted` | Secondary text |
| `text-subtle` | Metadata, placeholders |
| `border-border` | Standard borders |
| `border-border-subtle` | Light dividers |
| `bg-primary` / `text-primary` | Brand green accent |
| `bg-primary-hover` | Hover state for primary |
| `bg-danger` / `text-danger-text` | Error states |
| `bg-frost` / `text-frost-text` | Frost / rain alert colors |
| `bg-hail` / `text-hail-text` | Hail alert colors |
| `bg-wind` / `text-wind-text` | Wind / humidity alert colors |

### Typography
- `font-heading` → Outfit (used for page titles, card headers, sidebar brand)
- `font-body` / default → Inter (all other text)

### UI components (src/components/)

| Component | Location | Props |
|---|---|---|
| `Button` | `ui/button.tsx` | `variant?: 'primary' \| 'ghost' \| 'danger'`, `loading?: boolean` |
| `Card` | `ui/card.tsx` | Wrapper — bg-surface + border-border + rounded-lg + p-4 |
| `AlertBadge` | `ui/alert-badge.tsx` | `type: AlertType`, `message: string` |
| `WeatherWidget` | `greenhouse/weather-widget.tsx` | `temperature`, `humidity`, `wind` |
| `GreenhouseCard` | `greenhouse/greenhouse-card.tsx` | `id, name, lat, lng, area?, temperature?, humidity?, wind?` |
| `GreenhouseMap` | `greenhouse/greenhouse-map.tsx` | `markers: Marker[]`, `onSelect?: (id) => void` |
| `NavLink` | `nav/nav-link.tsx` | `href, icon: LucideIcon, label` — active state via `usePathname()` |

### Input pattern
```tsx
className="w-full bg-surface border border-border rounded-md px-3 py-2.5 text-sm
           text-foreground placeholder:text-subtle
           focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
```

### Alert badge color mapping
```ts
FROST         → bg-frost / text-frost-text     (label: "Helada")
HAIL          → bg-hail / text-hail-text        (label: "Granizo")
STRONG_WIND   → bg-wind / text-wind-text        (label: "Viento")
HIGH_HUMIDITY → bg-wind / text-wind-text        (label: "Humedad")
RAIN_EXPECTED → bg-frost / text-frost-text      (label: "Lluvia")
```

### Rounded pill
`rounded-pill` — used for area tags (m² badge). Defined in `@theme`.

---

## IV. Database — packages/db

### Prisma + Neon adapter
```ts
// db.ts — singleton pattern
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
export const db = globalForPrisma.prisma ?? new PrismaClient({ adapter })
```

**IMPORTANT**: The adapter pattern means `datasource db` in `schema.prisma` has **no `url` field** — intentional.

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")   // ← present in schema for Prisma tooling
}
```

### Commands
```bash
pnpm --filter @brotia/db db:push       # Apply schema changes (never migrate dev)
pnpm --filter @brotia/db db:generate   # Regenerate Prisma client
pnpm --filter @brotia/db db:studio     # Open Prisma Studio
```

**Never use `prisma migrate dev`** — `db push` only.

### Schema models

| Model | Key fields |
|---|---|
| `User` | `id`, `email` (unique), `name?`, `avatar?`, `provider?` |
| `Greenhouse` | `id`, `name`, `lat`, `lng`, `area?`, `userId` (FK→User) |
| `Crop` | `id`, `name`, `variety?`, `plantedAt`, `expectedHarvestAt?`, `status: CropStatus`, `greenhouseId` |
| `Note` | `id`, `content`, `photos: String[]`, `greenhouseId?`, `cropId?` |
| `WeatherAlert` | `id`, `type: AlertType`, `message`, `severity`, `read: Boolean`, `greenhouseId` |
| `PestRecord` | `id`, `pestName`, `severity`, `photos: String[]`, `cropId` |
| `Treatment` | `id`, `productName`, `dosePerUnit`, `safetyDays: Int`, `cropId` |
| `ChatMessage` | `id`, `role`, `content`, `userId` |

### Enums
```prisma
enum CropStatus { GROWING  HARVESTED  FAILED }
enum AlertType  { FROST  HAIL  STRONG_WIND  HIGH_HUMIDITY  RAIN_EXPECTED }
```

### Exported types (from packages/db)
```ts
import type { Greenhouse, Crop, Note, WeatherAlert, PestRecord, Treatment, ChatMessage, User }
  from '@brotia/db'
```

---

## V. API schemas — packages/api

Zod schemas shared across web and mobile.

```ts
// Greenhouses
createGreenhouseSchema   → { name: string(1–100), lat: number(±90), lng: number(±180), area?: number>0 }
updateGreenhouseSchema   → all fields partial

// Weather
WeatherResponse          → { current: { temperature_2m, relative_humidity_2m, wind_speed_10m, precipitation }, hourly: { ... } }
AlertCheckResult         → { type: AlertType, message: string, severity: 'low' | 'medium' | 'high' }
```

---

## VI. Weather & alerts — apps/web/src/lib/weather.ts

Uses **Open-Meteo** (free, no API key). Fetches with `{ next: { revalidate: 3600 } }`.

### Alert thresholds
```ts
FROST_THRESHOLD     = 2°C    (high severity below 0°C)
WIND_THRESHOLD      = 60km/h (high severity above 90km/h)
HUMIDITY_THRESHOLD  = 90%    → severity: 'low'
RAIN_PROB_THRESHOLD = 80%    → RAIN_EXPECTED (next 12h window)
HAIL_PROB_THRESHOLD = 70%    → HAIL (requires convective showers detected)
```

### Cron endpoint
`POST /api/alerts/check` — protected by `Authorization: Bearer CRON_SECRET`.
Iterates all greenhouses, calls `getWeather()` + `checkAlerts()`, persists `WeatherAlert` rows.
Configured in `vercel.json` to fire every hour: `"schedule": "0 * * * *"`.

---

## VII. Mobile app — apps/mobile

- **Expo 54** + **React Native 0.81**
- **NativeWind** (Tailwind classes on RN components)
- **expo-router** — file-based routing
- **expo-location** — GPS detection in new greenhouse form

### API client
`apps/mobile/lib/api.ts` — fetches from `EXPO_PUBLIC_API_URL` (defaults to `http://localhost:3000`).
Uses `credentials: 'include'` for session cookies.

### Screens
```
/(tabs)/index.tsx         → Greenhouse list
/(tabs)/crops.tsx         → (stub)
/(tabs)/chat.tsx          → (stub)
/(tabs)/settings.tsx      → (stub)
/greenhouse/[id].tsx      → Greenhouse detail (weather + alerts)
/greenhouse/new.tsx       → Create greenhouse (GPS auto-detect via expo-location)
```

### Theme
`apps/mobile/lib/theme.ts` exports `palette` object (colors) — used for `placeholderTextColor` and icon colors in RN (Tailwind can't reach these props).

---

## VIII. Auth — apps/web/src/lib/auth.ts

**NextAuth v5** with Prisma adapter.

```ts
providers: [
  Google({ clientId: AUTH_GOOGLE_ID, clientSecret: AUTH_GOOGLE_SECRET }),
  Resend({ apiKey: AUTH_RESEND_KEY, from: 'Brotia <brotia@brotia.app>' }),
]
```

Custom sign-in page: `/login`.

### Environment variables (web)
```env
DATABASE_URL=postgresql://...

AUTH_SECRET=...
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...

AUTH_RESEND_KEY=...          # ← exact var name read by auth.ts (NOT RESEND_API_KEY)

CRON_SECRET=...              # Shared secret for /api/alerts/check
```

**Gotcha**: The env var for Resend is `AUTH_RESEND_KEY`, not `RESEND_API_KEY`. The `from` address is hardcoded in `auth.ts` as `'Brotia <brotia@brotia.app>'`.

### Environment variables (mobile)
```env
EXPO_PUBLIC_API_URL=https://brotia.vercel.app   # or http://localhost:3000 for dev
```

---

## IX. Code conventions

### TypeScript
- **Arrow functions only** — never `export function foo()`
- **`type` over `interface`**
- **`import type`** for type-only imports
- No `any` — use proper types or `unknown` + narrowing

### File naming
- kebab-case everywhere: `greenhouse-card.tsx`, `weather-widget.tsx`

### Component conventions
- Server components: `async` function, no `'use client'`
- Client components: `'use client'` at top — forms, map, nav-link
- `memo()` on expensive components (GreenhouseMap)

### API route conventions
```ts
export const GET = async (_req: Request, { params }: Params) => { ... }
// Always return NextResponse.json({ error }, { status: NNN }) — never throw
// Wrap Prisma calls in try/catch
```

---

## X. Testing — apps/web/src/__tests__/

Vitest + Testing Library. Test files:
- `home.test.tsx`
- `greenhouses-api.test.ts`
- `auth.test.ts`
- `weather.test.ts`
- `alerts.test.ts`

```bash
pnpm test            # run all tests
pnpm test:watch      # watch mode
```

---

## XI. Known gotchas

| # | Gotcha |
|---|---|
| 1 | Resend env var is `AUTH_RESEND_KEY` (not `RESEND_API_KEY`) |
| 2 | `params` in route handlers/pages is `Promise<{...}>` in Next.js 16 — always `await params` |
| 3 | MapLibre GL must be dynamically imported with `ssr: false` — never import at module level |
| 4 | Prisma adapter pattern: `PrismaNeon` wraps connection, no `url` in datasource block (prisma tooling needs it but adapter overrides at runtime) |
| 5 | Open-Meteo `showers_sum` is optional in the hourly response — the Zod schema marks it `.optional()` |
| 6 | Mobile API client uses `credentials: 'include'` — session auth is cookie-based |
| 7 | Nav links to `/cultivos`, `/chat`, `/ajustes` exist in the sidebar but those pages are not built yet |
| 8 | `cancelled` flag in MapLibre `useEffect` prevents init from running after component unmounts during async dynamic import |
