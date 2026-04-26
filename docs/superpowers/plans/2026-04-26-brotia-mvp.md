# Brotia MVP — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Brotia MVP — Turborepo monorepo with Next.js web + Expo mobile, allowing farmers to register geolocalized greenhouses and see real-time weather per greenhouse.

**Architecture:** Turborepo monorepo with `apps/web` (Next.js 15), `apps/mobile` (Expo SDK 52), and shared packages for DB (Prisma + Neon), API schemas (Zod), and design tokens (Tailwind config + CSS tokens). Next.js API Routes serve both platforms. Weather data comes from Open-Meteo (no API key needed).

**Tech Stack:** Next.js 15 · Expo SDK 52 · Prisma 6 + Neon · NextAuth v5 · Open-Meteo · Tailwind CSS v4 · NativeWind v4 · react-map-gl + MapLibre GL · react-native-maps · pnpm workspaces · Turborepo

---

## File Structure

```
brotia/
├── apps/
│   ├── web/
│   │   ├── src/app/
│   │   │   ├── (auth)/login/page.tsx
│   │   │   ├── (dashboard)/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx                          ← greenhouse list
│   │   │   │   └── greenhouse/
│   │   │   │       ├── [id]/page.tsx                 ← greenhouse detail
│   │   │   │       └── new/page.tsx                  ← add greenhouse
│   │   │   ├── api/
│   │   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   │   ├── greenhouses/route.ts              ← GET list, POST create
│   │   │   │   ├── greenhouses/[id]/route.ts         ← GET, PUT, DELETE
│   │   │   │   ├── greenhouses/[id]/weather/route.ts ← GET weather
│   │   │   │   └── alerts/check/route.ts             ← cron hourly
│   │   │   ├── globals.css                           ← Tailwind v4 + tokens
│   │   │   └── layout.tsx
│   │   ├── src/components/
│   │   │   ├── greenhouse/
│   │   │   │   ├── greenhouse-card.tsx
│   │   │   │   ├── greenhouse-map.tsx
│   │   │   │   └── weather-widget.tsx
│   │   │   └── ui/
│   │   │       ├── button.tsx
│   │   │       ├── card.tsx
│   │   │       └── alert-badge.tsx
│   │   ├── src/lib/
│   │   │   ├── auth.ts
│   │   │   └── weather.ts
│   │   ├── src/__tests__/
│   │   │   ├── weather.test.ts
│   │   │   └── alerts.test.ts
│   │   ├── next.config.ts
│   │   ├── tailwind.config.ts
│   │   └── package.json
│   └── mobile/
│       ├── app/
│       │   ├── _layout.tsx                           ← root layout + tab bar
│       │   ├── (tabs)/
│       │   │   ├── index.tsx                         ← greenhouse list
│       │   │   ├── weather.tsx
│       │   │   ├── crops.tsx
│       │   │   ├── chat.tsx
│       │   │   └── settings.tsx
│       │   └── greenhouse/
│       │       ├── [id].tsx                          ← greenhouse detail
│       │       └── new.tsx                           ← add greenhouse (GPS)
│       ├── components/
│       │   ├── GreenhouseCard.tsx
│       │   └── WeatherWidget.tsx
│       ├── lib/
│       │   └── api.ts                                ← fetch wrapper → web API
│       ├── tailwind.config.ts
│       └── package.json
├── packages/
│   ├── db/
│   │   ├── prisma/schema.prisma
│   │   ├── src/index.ts                              ← PrismaClient singleton
│   │   └── package.json
│   ├── api/
│   │   ├── src/schemas/
│   │   │   ├── greenhouse.ts                         ← Zod schemas
│   │   │   └── weather.ts
│   │   ├── src/index.ts
│   │   └── package.json
│   └── config/
│       ├── tokens.css                                ← CSS custom properties
│       ├── tailwind.config.ts                        ← shared Tailwind config
│       ├── tsconfig/
│       │   ├── base.json
│       │   ├── nextjs.json
│       │   └── react-native.json
│       └── package.json
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

---

## Task 1: Monorepo Setup

**Files:**
- Create: `package.json` (root)
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `packages/config/package.json`
- Create: `packages/config/tsconfig/base.json`
- Create: `packages/config/tsconfig/nextjs.json`
- Create: `packages/config/tsconfig/react-native.json`

- [ ] **Step 1: Initialize root package.json**

```bash
mkdir -p /Users/victorrubia/brotia && cd /Users/victorrubia/brotia
```

Create `package.json`:
```json
{
  "name": "brotia",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test"
  },
  "devDependencies": {
    "turbo": "^2.3.0",
    "typescript": "^5.7.0"
  },
  "packageManager": "pnpm@9.15.0"
}
```

- [ ] **Step 2: Create pnpm workspace**

Create `pnpm-workspace.yaml`:
```yaml
packages:
  - "apps/*"
  - "packages/*"
```

- [ ] **Step 3: Create turbo.json**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "ui": "tui",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", ".env*"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "lint": {}
  }
}
```

- [ ] **Step 4: Create packages/config**

```bash
mkdir -p packages/config/tsconfig
```

Create `packages/config/package.json`:
```json
{
  "name": "@brotia/config",
  "version": "0.0.1",
  "private": true,
  "exports": {
    "./tailwind": "./tailwind.config.ts",
    "./tsconfig/*": "./tsconfig/*.json",
    "./tokens": "./tokens.css"
  }
}
```

- [ ] **Step 5: Create shared tsconfig files**

`packages/config/tsconfig/base.json`:
```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  }
}
```

`packages/config/tsconfig/nextjs.json`:
```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  }
}
```

`packages/config/tsconfig/react-native.json`:
```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["esnext"],
    "module": "CommonJS",
    "jsx": "react-native",
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true
  }
}
```

- [ ] **Step 6: Install root dependencies**

```bash
pnpm install
```

Expected: `node_modules/.pnpm` created, `pnpm-lock.yaml` generated.

- [ ] **Step 7: Commit**

```bash
git init
echo "node_modules\n.next\ndist\n.env*\n*.tsbuildinfo" > .gitignore
git add .
git commit -m "chore: initialize Turborepo monorepo with pnpm workspaces"
```

---

## Task 2: Design Tokens Package

**Files:**
- Create: `packages/config/tokens.css`
- Create: `packages/config/tailwind.config.ts`

- [ ] **Step 1: Create CSS design tokens**

Create `packages/config/tokens.css`:
```css
@theme inline {
  /* ── Backgrounds ─────────────────────────────── */
  --color-background:     #FAFCF7;
  --color-surface:        #FFFFFF;
  --color-surface-alt:    #F2F7EE;
  --color-surface-raised: #E8F2DF;

  /* ── Verdes principales ───────────────────────── */
  --color-primary:        #2D5A1B;
  --color-primary-hover:  #3D7525;
  --color-primary-light:  #5A9E3E;

  /* ── Verdes secundarios ──────────────────────── */
  --color-pea:            #8DB84A;
  --color-olive:          #6B7C3D;
  --color-sage:           #A8C185;
  --color-mint:           #D4E6C3;

  /* ── Textos ──────────────────────────────────── */
  --color-foreground:     #1C2E0F;
  --color-muted:          #4B6838;
  --color-subtle:         #7A9B6A;

  /* ── Bordes ──────────────────────────────────── */
  --color-border:         #C8DEB5;
  --color-border-subtle:  #E2EFDA;

  /* ── Alertas semánticas ───────────────────────── */
  --color-frost:          #BAE6FD;
  --color-frost-text:     #0369A1;
  --color-hail:           #C7D2FE;
  --color-hail-text:      #3730A3;
  --color-wind:           #FEF3C7;
  --color-wind-text:      #92400E;
  --color-danger:         #FEE2E2;
  --color-danger-text:    #991B1B;

  /* ── Acento CTA ───────────────────────────────── */
  --color-harvest:        #CA8A04;
  --color-harvest-hover:  #A16207;

  /* ── Radios orgánicos ────────────────────────── */
  --radius-sm:   8px;
  --radius-md:   16px;
  --radius-lg:   24px;
  --radius-pill: 9999px;

  /* ── Sombras naturales ───────────────────────── */
  --shadow-sm:  0 1px 4px rgba(45, 90, 27, 0.08);
  --shadow-md:  0 4px 16px rgba(45, 90, 27, 0.12);
  --shadow-lg:  0 8px 32px rgba(45, 90, 27, 0.16);

  /* ── Tipografía ──────────────────────────────── */
  --font-heading: 'Outfit', sans-serif;
  --font-body:    'Inter', sans-serif;
  --font-mono:    'JetBrains Mono', monospace;
}
```

- [ ] **Step 2: Create shared Tailwind config**

Create `packages/config/tailwind.config.ts`:
```ts
import type { Config } from 'tailwindcss'

const config: Omit<Config, 'content'> = {
  theme: {
    extend: {
      fontFamily: {
        heading: ['Outfit', 'sans-serif'],
        body:    ['Inter', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        sm:   '8px',
        md:   '16px',
        lg:   '24px',
        pill: '9999px',
      },
    },
  },
}

export default config
```

- [ ] **Step 3: Commit**

```bash
git add packages/config/
git commit -m "feat(config): add design tokens and shared Tailwind config"
```

---

## Task 3: Database Package

**Files:**
- Create: `packages/db/package.json`
- Create: `packages/db/prisma/schema.prisma`
- Create: `packages/db/src/index.ts`
- Create: `packages/db/tsconfig.json`

- [ ] **Step 1: Initialize packages/db**

Create `packages/db/package.json`:
```json
{
  "name": "@brotia/db",
  "version": "0.0.1",
  "private": true,
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "db:push": "prisma db push",
    "db:generate": "prisma generate",
    "db:studio": "prisma studio"
  },
  "dependencies": {
    "@prisma/adapter-neon": "^6.0.0",
    "@prisma/client": "^6.0.0",
    "@neondatabase/serverless": "^0.10.0"
  },
  "devDependencies": {
    "prisma": "^6.0.0"
  }
}
```

Create `packages/db/tsconfig.json`:
```json
{
  "extends": "@brotia/config/tsconfig/base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

- [ ] **Step 2: Write Prisma schema**

Create `packages/db/prisma/schema.prisma`:
```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String        @id @default(cuid())
  email        String        @unique
  name         String?
  avatar       String?
  provider     String?
  createdAt    DateTime      @default(now())
  greenhouses  Greenhouse[]
  chatMessages ChatMessage[]
}

model Greenhouse {
  id        String         @id @default(cuid())
  name      String
  lat       Float
  lng       Float
  area      Float?
  userId    String
  user      User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime       @default(now())
  crops     Crop[]
  notes     Note[]
  alerts    WeatherAlert[]
}

model Crop {
  id                String       @id @default(cuid())
  name              String
  variety           String?
  plantedAt         DateTime
  expectedHarvestAt DateTime?
  harvestedAt       DateTime?
  yieldKg           Float?
  status            CropStatus   @default(GROWING)
  season            String?
  greenhouseId      String
  greenhouse        Greenhouse   @relation(fields: [greenhouseId], references: [id], onDelete: Cascade)
  createdAt         DateTime     @default(now())
  notes             Note[]
  pestRecords       PestRecord[]
  treatments        Treatment[]
}

enum CropStatus {
  GROWING
  HARVESTED
  FAILED
}

model Note {
  id           String      @id @default(cuid())
  content      String
  photos       String[]
  createdAt    DateTime    @default(now())
  greenhouseId String?
  greenhouse   Greenhouse? @relation(fields: [greenhouseId], references: [id])
  cropId       String?
  crop         Crop?       @relation(fields: [cropId], references: [id])
}

model WeatherAlert {
  id           String     @id @default(cuid())
  type         AlertType
  message      String
  severity     String
  read         Boolean    @default(false)
  triggeredAt  DateTime   @default(now())
  greenhouseId String
  greenhouse   Greenhouse @relation(fields: [greenhouseId], references: [id], onDelete: Cascade)
}

enum AlertType {
  FROST
  HAIL
  STRONG_WIND
  HIGH_HUMIDITY
  RAIN_EXPECTED
}

model PestRecord {
  id         String   @id @default(cuid())
  pestName   String
  severity   String
  notes      String?
  photos     String[]
  detectedAt DateTime @default(now())
  cropId     String
  crop       Crop     @relation(fields: [cropId], references: [id], onDelete: Cascade)
}

model Treatment {
  id          String   @id @default(cuid())
  productName String
  dosePerUnit String
  appliedAt   DateTime @default(now())
  safetyDays  Int
  notes       String?
  cropId      String
  crop        Crop     @relation(fields: [cropId], references: [id], onDelete: Cascade)
}

model ChatMessage {
  id        String   @id @default(cuid())
  role      String
  content   String
  createdAt DateTime @default(now())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

- [ ] **Step 3: Create PrismaClient singleton**

Create `packages/db/src/index.ts`:
```ts
import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { neonConfig } from '@neondatabase/serverless'
import ws from 'ws'

neonConfig.webSocketConstructor = ws

const createPrismaClient = () => {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
  return new PrismaClient({ adapter })
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}

export { PrismaClient }
export type { Greenhouse, Crop, Note, WeatherAlert, PestRecord, Treatment, ChatMessage, User } from '@prisma/client'
```

- [ ] **Step 4: Install and generate**

```bash
cd packages/db
pnpm install
pnpm db:generate
```

Expected: `node_modules/@prisma/client` generated.

- [ ] **Step 5: Create .env at root**

Create `.env` at root (never commit this file):
```bash
DATABASE_URL="postgresql://..."   # Get from Neon dashboard
AUTH_SECRET="run: openssl rand -base64 32"
AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""
ANTHROPIC_API_KEY=""
BLOB_READ_WRITE_TOKEN=""
```

- [ ] **Step 6: Push schema to Neon**

```bash
cd packages/db
pnpm db:push
```

Expected: `All migrations are now applied.`

- [ ] **Step 7: Commit**

```bash
cd ../..
git add packages/db/ .gitignore
git commit -m "feat(db): add Prisma schema and Neon adapter singleton"
```

---

## Task 4: Shared API Schemas

**Files:**
- Create: `packages/api/package.json`
- Create: `packages/api/src/schemas/greenhouse.ts`
- Create: `packages/api/src/schemas/weather.ts`
- Create: `packages/api/src/index.ts`
- Create: `packages/api/tsconfig.json`

- [ ] **Step 1: Initialize packages/api**

Create `packages/api/package.json`:
```json
{
  "name": "@brotia/api",
  "version": "0.0.1",
  "private": true,
  "exports": {
    ".": "./src/index.ts"
  },
  "dependencies": {
    "zod": "^3.23.0"
  }
}
```

Create `packages/api/tsconfig.json`:
```json
{
  "extends": "@brotia/config/tsconfig/base.json",
  "compilerOptions": { "outDir": "dist", "rootDir": "src" },
  "include": ["src"]
}
```

- [ ] **Step 2: Create greenhouse schemas**

Create `packages/api/src/schemas/greenhouse.ts`:
```ts
import { z } from 'zod'

export const createGreenhouseSchema = z.object({
  name: z.string().min(1).max(100),
  lat:  z.number().min(-90).max(90),
  lng:  z.number().min(-180).max(180),
  area: z.number().positive().optional(),
})

export const updateGreenhouseSchema = createGreenhouseSchema.partial()

export type CreateGreenhouseInput = z.infer<typeof createGreenhouseSchema>
export type UpdateGreenhouseInput = z.infer<typeof updateGreenhouseSchema>
```

- [ ] **Step 3: Create weather types**

Create `packages/api/src/schemas/weather.ts`:
```ts
import { z } from 'zod'

export const weatherResponseSchema = z.object({
  current: z.object({
    temperature_2m:       z.number(),
    relative_humidity_2m: z.number(),
    wind_speed_10m:       z.number(),
    precipitation:        z.number(),
  }),
  hourly: z.object({
    time:                      z.array(z.string()),
    temperature_2m:            z.array(z.number()),
    precipitation_probability: z.array(z.number()),
    showers_sum:               z.array(z.number()).optional(),
  }),
})

export type WeatherResponse = z.infer<typeof weatherResponseSchema>

export type AlertCheckResult = {
  type: 'FROST' | 'HAIL' | 'STRONG_WIND' | 'HIGH_HUMIDITY' | 'RAIN_EXPECTED'
  message: string
  severity: 'low' | 'medium' | 'high'
}
```

- [ ] **Step 4: Create package index**

Create `packages/api/src/index.ts`:
```ts
export * from './schemas/greenhouse'
export * from './schemas/weather'
```

- [ ] **Step 5: Install and commit**

```bash
cd packages/api && pnpm install
cd ../..
git add packages/api/
git commit -m "feat(api): add shared Zod schemas for greenhouse and weather"
```

---

## Task 5: Next.js App Setup

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/next.config.ts`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/src/app/globals.css`
- Create: `apps/web/src/app/layout.tsx`
- Create: `apps/web/tailwind.config.ts`

- [ ] **Step 1: Create Next.js app**

```bash
cd apps
pnpm create next-app web --typescript --tailwind --app --src-dir --import-alias "@/*" --no-git
cd web
```

- [ ] **Step 2: Install dependencies**

```bash
pnpm add @brotia/config @brotia/db @brotia/api
pnpm add next-auth@5 @auth/prisma-adapter
pnpm add react-map-gl maplibre-gl
pnpm add lucide-react
pnpm add -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 3: Configure Next.js**

Replace `apps/web/next.config.ts`:
```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@brotia/db', '@brotia/api'],
}

export default nextConfig
```

- [ ] **Step 4: Configure tailwind with tokens**

Replace `apps/web/tailwind.config.ts`:
```ts
import type { Config } from 'tailwindcss'
import sharedConfig from '@brotia/config/tailwind'

const config: Config = {
  ...sharedConfig,
  content: [
    './src/**/*.{ts,tsx}',
  ],
}

export default config
```

- [ ] **Step 5: Set up globals.css with tokens**

Replace `apps/web/src/app/globals.css`:
```css
@import "tailwindcss";
@import "@brotia/config/tokens";

@layer base {
  html {
    font-family: var(--font-body);
    background-color: var(--color-background);
    color: var(--color-foreground);
  }

  h1, h2, h3, h4 {
    font-family: var(--font-heading);
  }
}
```

- [ ] **Step 6: Create root layout**

Replace `apps/web/src/app/layout.tsx`:
```tsx
import type { Metadata } from 'next'
import { Inter, Outfit } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-body' })
const outfit = Outfit({ subsets: ['latin'], variable: '--font-heading' })

export const metadata: Metadata = {
  title: 'Brotia — Gestión de Invernaderos',
  description: 'App para agricultores: clima, cultivos y alertas por invernadero',
}

const RootLayout = ({ children }: { children: React.ReactNode }) => (
  <html lang="es" className={`${inter.variable} ${outfit.variable}`}>
    <body className="bg-background text-foreground min-h-screen">
      {children}
    </body>
  </html>
)

export default RootLayout
```

- [ ] **Step 7: Verify Next.js runs**

```bash
pnpm dev
```

Expected: `http://localhost:3000` loads without errors.

- [ ] **Step 8: Commit**

```bash
git add apps/web/
git commit -m "feat(web): scaffold Next.js 15 app with Tailwind v4 and design tokens"
```

---

## Task 6: Authentication

**Files:**
- Create: `apps/web/src/lib/auth.ts`
- Create: `apps/web/src/app/api/auth/[...nextauth]/route.ts`
- Create: `apps/web/src/app/(auth)/login/page.tsx`

- [ ] **Step 1: Write failing test for auth config**

Create `apps/web/src/__tests__/auth.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { authConfig } from '../lib/auth'

describe('authConfig', () => {
  it('has Google provider configured', () => {
    const providerIds = authConfig.providers.map((p: any) => p.id)
    expect(providerIds).toContain('google')
  })

  it('has Apple provider configured', () => {
    const providerIds = authConfig.providers.map((p: any) => p.id)
    expect(providerIds).toContain('apple')
  })

  it('has Resend provider configured', () => {
    const providerIds = authConfig.providers.map((p: any) => p.id)
    expect(providerIds).toContain('resend')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm vitest run src/__tests__/auth.test.ts
```

Expected: FAIL — `Cannot find module '../lib/auth'`

- [ ] **Step 3: Create auth config**

Create `apps/web/src/lib/auth.ts`:
```ts
import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Apple from 'next-auth/providers/apple'
import Resend from 'next-auth/providers/resend'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { db } from '@brotia/db'

export const authConfig = {
  adapter: PrismaAdapter(db),
  providers: [
    Google({
      clientId:     process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    Apple({
      clientId:     process.env.AUTH_APPLE_ID!,
      clientSecret: process.env.AUTH_APPLE_SECRET!,
    }),
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY!,
      from:   'Brotia <brotia@brotia.app>',
    }),
  ],
  pages: {
    signIn: '/login',
  },
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm vitest run src/__tests__/auth.test.ts
```

Expected: PASS

- [ ] **Step 5: Create auth route**

Create `apps/web/src/app/api/auth/[...nextauth]/route.ts`:
```ts
import { handlers } from '@/lib/auth'

export const { GET, POST } = handlers
```

- [ ] **Step 6: Create login page**

Create `apps/web/src/app/(auth)/login/page.tsx`:
```tsx
import { signIn } from '@/lib/auth'
import { Button } from '@/components/ui/button'

const LoginPage = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="bg-surface rounded-lg p-8 shadow-md w-full max-w-sm border border-border">
      <h1 className="font-heading text-2xl text-foreground mb-2">Brotia</h1>
      <p className="text-muted text-sm mb-8">Accede a tus invernaderos</p>

      <div className="flex flex-col gap-3">
        <form action={async () => { 'use server'; await signIn('google') }}>
          <button
            type="submit"
            className="w-full bg-surface-alt border border-border text-foreground rounded-md py-2.5 px-4 text-sm font-medium hover:bg-surface-raised transition-colors cursor-pointer"
          >
            Continuar con Google
          </button>
        </form>

        <form action={async (fd: FormData) => {
          'use server'
          await signIn('resend', { email: fd.get('email'), redirectTo: '/' })
        }}>
          <input
            name="email"
            type="email"
            placeholder="tu@email.com"
            className="w-full bg-surface border border-border rounded-md px-3 py-2.5 text-sm text-foreground placeholder:text-subtle mb-2 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
          />
          <button
            type="submit"
            className="w-full bg-primary text-white rounded-md py-2.5 px-4 text-sm font-medium hover:bg-primary-hover transition-colors cursor-pointer"
          >
            Enviar enlace de acceso
          </button>
        </form>
      </div>
    </div>
  </div>
)

export default LoginPage
```

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/lib/auth.ts apps/web/src/app/api/auth apps/web/src/app/\(auth\)/ apps/web/src/__tests__/auth.test.ts
git commit -m "feat(web/auth): add NextAuth v5 with Google and email (Resend) providers"
```

---

## Task 7: Greenhouses API Routes

**Files:**
- Create: `apps/web/src/app/api/greenhouses/route.ts`
- Create: `apps/web/src/app/api/greenhouses/[id]/route.ts`
- Create: `apps/web/src/__tests__/greenhouses-api.test.ts`

- [ ] **Step 1: Write failing tests**

Create `apps/web/src/__tests__/greenhouses-api.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@brotia/db', () => ({
  db: {
    greenhouse: {
      findMany:  vi.fn(),
      create:    vi.fn(),
      findFirst: vi.fn(),
      update:    vi.fn(),
      delete:    vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth', () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: 'user-1', email: 'farmer@test.com' } }),
}))

import { db } from '@brotia/db'
import { GET, POST } from '../app/api/greenhouses/route'

describe('GET /api/greenhouses', () => {
  it('returns greenhouses for authenticated user', async () => {
    vi.mocked(db.greenhouse.findMany).mockResolvedValue([
      { id: 'gh-1', name: 'Invernadero Norte', lat: 37.5, lng: -5.9, area: 200, userId: 'user-1', createdAt: new Date() },
    ] as any)

    const req = new Request('http://localhost/api/greenhouses')
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toHaveLength(1)
    expect(body[0].name).toBe('Invernadero Norte')
  })
})

describe('POST /api/greenhouses', () => {
  it('creates a greenhouse with valid data', async () => {
    const payload = { name: 'Invernadero Sur', lat: 37.4, lng: -5.8, area: 150 }

    vi.mocked(db.greenhouse.create).mockResolvedValue({
      id: 'gh-2', ...payload, userId: 'user-1', createdAt: new Date(),
    } as any)

    const req = new Request('http://localhost/api/greenhouses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.name).toBe('Invernadero Sur')
  })

  it('returns 400 for missing name', async () => {
    const req = new Request('http://localhost/api/greenhouses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat: 37.4, lng: -5.8 }),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm vitest run src/__tests__/greenhouses-api.test.ts
```

Expected: FAIL — `Cannot find module '../app/api/greenhouses/route'`

- [ ] **Step 3: Create greenhouses list/create route**

Create `apps/web/src/app/api/greenhouses/route.ts`:
```ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@brotia/db'
import { createGreenhouseSchema } from '@brotia/api'

export const GET = async () => {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const greenhouses = await db.greenhouse.findMany({
    where:   { userId: session.user.id },
    include: { crops: { where: { status: 'GROWING' }, take: 1 } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(greenhouses)
}

export const POST = async (req: Request) => {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = createGreenhouseSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const greenhouse = await db.greenhouse.create({
    data: { ...parsed.data, userId: session.user.id },
  })

  return NextResponse.json(greenhouse, { status: 201 })
}
```

- [ ] **Step 4: Create greenhouse detail/update/delete route**

Create `apps/web/src/app/api/greenhouses/[id]/route.ts`:
```ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@brotia/db'
import { updateGreenhouseSchema } from '@brotia/api'

type Params = { params: Promise<{ id: string }> }

export const GET = async (_req: Request, { params }: Params) => {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const greenhouse = await db.greenhouse.findFirst({
    where:   { id, userId: session.user.id },
    include: { crops: true, notes: { orderBy: { createdAt: 'desc' }, take: 5 }, alerts: { where: { read: false } } },
  })

  if (!greenhouse) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  return NextResponse.json(greenhouse)
}

export const PUT = async (req: Request, { params }: Params) => {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const existing = await db.greenhouse.findFirst({ where: { id, userId: session.user.id } })

  if (!existing) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const body = await req.json()
  const parsed = updateGreenhouseSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const updated = await db.greenhouse.update({ where: { id }, data: parsed.data })
  return NextResponse.json(updated)
}

export const DELETE = async (_req: Request, { params }: Params) => {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const existing = await db.greenhouse.findFirst({ where: { id, userId: session.user.id } })

  if (!existing) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  await db.greenhouse.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
pnpm vitest run src/__tests__/greenhouses-api.test.ts
```

Expected: PASS (3 tests)

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/api/greenhouses/ apps/web/src/__tests__/greenhouses-api.test.ts
git commit -m "feat(web/api): add greenhouses CRUD routes with auth guard and Zod validation"
```

---

## Task 8: Weather Integration

**Files:**
- Create: `apps/web/src/lib/weather.ts`
- Create: `apps/web/src/app/api/greenhouses/[id]/weather/route.ts`
- Create: `apps/web/src/__tests__/weather.test.ts`

- [ ] **Step 1: Write failing tests**

Create `apps/web/src/__tests__/weather.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest'
import { getWeather, checkAlerts } from '../lib/weather'
import type { WeatherResponse } from '@brotia/api'

const mockWeather: WeatherResponse = {
  current: {
    temperature_2m:       1.5,
    relative_humidity_2m: 88,
    wind_speed_10m:       12,
    precipitation:        0,
  },
  hourly: {
    time:                      ['2026-04-26T00:00', '2026-04-26T01:00'],
    temperature_2m:            [1.5, 1.2],
    precipitation_probability: [10, 15],
    showers_sum:               [0, 0],
  },
}

describe('checkAlerts', () => {
  it('detects FROST when temperature < 2°C', () => {
    const alerts = checkAlerts(mockWeather)
    const types = alerts.map(a => a.type)
    expect(types).toContain('FROST')
  })

  it('detects HIGH_HUMIDITY when humidity > 90%', () => {
    const highHumidity = {
      ...mockWeather,
      current: { ...mockWeather.current, relative_humidity_2m: 92 },
    }
    const alerts = checkAlerts(highHumidity)
    const types = alerts.map(a => a.type)
    expect(types).toContain('HIGH_HUMIDITY')
  })

  it('detects STRONG_WIND when wind > 60 km/h', () => {
    const strongWind = {
      ...mockWeather,
      current: { ...mockWeather.current, wind_speed_10m: 65 },
    }
    const alerts = checkAlerts(strongWind)
    const types = alerts.map(a => a.type)
    expect(types).toContain('STRONG_WIND')
  })

  it('returns no alerts when conditions are normal', () => {
    const normal: WeatherResponse = {
      current: { temperature_2m: 22, relative_humidity_2m: 65, wind_speed_10m: 15, precipitation: 0 },
      hourly:  { time: [], temperature_2m: [], precipitation_probability: [20], showers_sum: [0] },
    }
    const alerts = checkAlerts(normal)
    expect(alerts).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm vitest run src/__tests__/weather.test.ts
```

Expected: FAIL — `Cannot find module '../lib/weather'`

- [ ] **Step 3: Implement weather lib**

Create `apps/web/src/lib/weather.ts`:
```ts
import type { WeatherResponse, AlertCheckResult } from '@brotia/api'

const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast'

export const getWeather = async (lat: number, lng: number): Promise<WeatherResponse> => {
  const url = new URL(OPEN_METEO_URL)
  url.searchParams.set('latitude',  lat.toString())
  url.searchParams.set('longitude', lng.toString())
  url.searchParams.set('current',   'temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation')
  url.searchParams.set('hourly',    'temperature_2m,precipitation_probability,showers_sum')
  url.searchParams.set('forecast_days', '7')
  url.searchParams.set('timezone',  'auto')

  const res = await fetch(url.toString(), {
    next: { revalidate: 3600 },
  })

  if (!res.ok) {
    throw new Error(`Open-Meteo error: ${res.status}`)
  }

  return res.json() as Promise<WeatherResponse>
}

export const checkAlerts = (weather: WeatherResponse): AlertCheckResult[] => {
  const alerts: AlertCheckResult[] = []
  const { current, hourly } = weather

  if (current.temperature_2m < 2) {
    alerts.push({
      type:     'FROST',
      message:  `Temperatura de ${current.temperature_2m}°C — riesgo de helada`,
      severity: current.temperature_2m < 0 ? 'high' : 'medium',
    })
  }

  if (current.wind_speed_10m > 60) {
    alerts.push({
      type:     'STRONG_WIND',
      message:  `Viento de ${current.wind_speed_10m} km/h — viento fuerte`,
      severity: current.wind_speed_10m > 90 ? 'high' : 'medium',
    })
  }

  if (current.relative_humidity_2m > 90) {
    alerts.push({
      type:     'HIGH_HUMIDITY',
      message:  `Humedad del ${current.relative_humidity_2m}% — riesgo de hongos`,
      severity: 'low',
    })
  }

  const nextHourPrecipProb = hourly.precipitation_probability[0] ?? 0
  const nextHourShowers    = (hourly.showers_sum ?? [])[0] ?? 0

  if (nextHourPrecipProb > 80) {
    alerts.push({
      type:     'RAIN_EXPECTED',
      message:  `${nextHourPrecipProb}% probabilidad de lluvia en la próxima hora`,
      severity: 'low',
    })
  }

  if (nextHourPrecipProb > 70 && nextHourShowers > 0) {
    alerts.push({
      type:     'HAIL',
      message:  'Lluvia convectiva detectada — posible granizo',
      severity: 'high',
    })
  }

  return alerts
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm vitest run src/__tests__/weather.test.ts
```

Expected: PASS (4 tests)

- [ ] **Step 5: Create weather API route**

Create `apps/web/src/app/api/greenhouses/[id]/weather/route.ts`:
```ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@brotia/db'
import { getWeather, checkAlerts } from '@/lib/weather'

type Params = { params: Promise<{ id: string }> }

export const GET = async (_req: Request, { params }: Params) => {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const greenhouse = await db.greenhouse.findFirst({
    where: { id, userId: session.user.id },
    select: { lat: true, lng: true },
  })

  if (!greenhouse) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const weather = await getWeather(greenhouse.lat, greenhouse.lng)
  const alerts  = checkAlerts(weather)

  return NextResponse.json({ weather, alerts })
}
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/lib/weather.ts apps/web/src/app/api/greenhouses/\[id\]/weather/ apps/web/src/__tests__/weather.test.ts
git commit -m "feat(web/weather): add Open-Meteo integration and alert detection logic"
```

---

## Task 9: Alerts Cron Job

**Files:**
- Create: `apps/web/src/app/api/alerts/check/route.ts`
- Create: `apps/web/vercel.json`

- [ ] **Step 1: Write failing test**

Create `apps/web/src/__tests__/alerts.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest'

vi.mock('@brotia/db', () => ({
  db: {
    greenhouse: { findMany: vi.fn() },
    weatherAlert: { create: vi.fn() },
  },
}))

vi.mock('@/lib/weather', () => ({
  getWeather:   vi.fn(),
  checkAlerts:  vi.fn(),
}))

import { db } from '@brotia/db'
import { getWeather, checkAlerts } from '@/lib/weather'
import { POST } from '../app/api/alerts/check/route'

describe('POST /api/alerts/check', () => {
  it('creates alerts for all greenhouses with issues', async () => {
    vi.mocked(db.greenhouse.findMany).mockResolvedValue([
      { id: 'gh-1', lat: 37.5, lng: -5.9 },
    ] as any)

    vi.mocked(getWeather).mockResolvedValue({} as any)

    vi.mocked(checkAlerts).mockReturnValue([
      { type: 'FROST', message: 'Helada detectada', severity: 'high' },
    ])

    vi.mocked(db.weatherAlert.create).mockResolvedValue({} as any)

    const req = new Request('http://localhost/api/alerts/check', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
    })

    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.created).toBe(1)
    expect(db.weatherAlert.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ type: 'FROST' }) })
    )
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm vitest run src/__tests__/alerts.test.ts
```

Expected: FAIL — route not found

- [ ] **Step 3: Create alerts cron route**

Create `apps/web/src/app/api/alerts/check/route.ts`:
```ts
import { NextResponse } from 'next/server'
import { db } from '@brotia/db'
import { getWeather, checkAlerts } from '@/lib/weather'

export const POST = async (req: Request) => {
  const authHeader = req.headers.get('Authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const greenhouses = await db.greenhouse.findMany({
    select: { id: true, lat: true, lng: true },
  })

  let created = 0

  for (const greenhouse of greenhouses) {
    const weather = await getWeather(greenhouse.lat, greenhouse.lng)
    const alerts  = checkAlerts(weather)

    for (const alert of alerts) {
      await db.weatherAlert.create({
        data: {
          greenhouseId: greenhouse.id,
          type:         alert.type,
          message:      alert.message,
          severity:     alert.severity,
        },
      })
      created++
    }
  }

  return NextResponse.json({ ok: true, created })
}
```

- [ ] **Step 4: Configure Vercel Cron**

Create `apps/web/vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/alerts/check",
      "schedule": "0 * * * *"
    }
  ]
}
```

Add `CRON_SECRET` to `.env`:
```bash
CRON_SECRET="generate: openssl rand -hex 32"
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
pnpm vitest run src/__tests__/alerts.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/api/alerts/ apps/web/vercel.json apps/web/src/__tests__/alerts.test.ts
git commit -m "feat(web/alerts): add hourly cron for weather alert detection"
```

---

## Task 10: Web UI Components

**Files:**
- Create: `apps/web/src/components/ui/button.tsx`
- Create: `apps/web/src/components/ui/card.tsx`
- Create: `apps/web/src/components/ui/alert-badge.tsx`
- Create: `apps/web/src/components/greenhouse/weather-widget.tsx`
- Create: `apps/web/src/components/greenhouse/greenhouse-card.tsx`
- Create: `apps/web/src/components/greenhouse/greenhouse-map.tsx`

- [ ] **Step 1: Create Button component**

Create `apps/web/src/components/ui/button.tsx`:
```tsx
import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'ghost' | 'danger'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  loading?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-hover',
  ghost:   'border border-border text-muted hover:text-foreground hover:border-primary/50',
  danger:  'bg-danger text-danger-text hover:opacity-90',
}

export const Button = ({ variant = 'primary', loading = false, children, className = '', disabled, ...props }: ButtonProps) => (
  <button
    {...props}
    disabled={disabled || loading}
    className={`
      inline-flex items-center justify-center gap-2
      px-4 py-2.5 rounded-md text-sm font-medium
      transition-colors duration-150 cursor-pointer
      disabled:opacity-50 disabled:cursor-not-allowed
      ${variantClasses[variant]} ${className}
    `.trim()}
  >
    {loading ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : null}
    {children}
  </button>
)
```

- [ ] **Step 2: Create Card component**

Create `apps/web/src/components/ui/card.tsx`:
```tsx
import type { HTMLAttributes } from 'react'

type CardProps = HTMLAttributes<HTMLDivElement>

export const Card = ({ children, className = '', ...props }: CardProps) => (
  <div
    {...props}
    className={`bg-surface border border-border rounded-lg shadow-sm ${className}`}
  >
    {children}
  </div>
)
```

- [ ] **Step 3: Create AlertBadge component**

Create `apps/web/src/components/ui/alert-badge.tsx`:
```tsx
import type { AlertType } from '@brotia/db'

type AlertBadgeProps = { type: AlertType; className?: string }

const alertStyles: Record<AlertType, { bg: string; text: string; label: string }> = {
  FROST:        { bg: 'bg-frost',  text: 'text-frost-text',  label: 'Helada' },
  HAIL:         { bg: 'bg-hail',   text: 'text-hail-text',   label: 'Granizo' },
  STRONG_WIND:  { bg: 'bg-wind',   text: 'text-wind-text',   label: 'Viento fuerte' },
  HIGH_HUMIDITY:{ bg: 'bg-surface-alt', text: 'text-muted',  label: 'Humedad alta' },
  RAIN_EXPECTED:{ bg: 'bg-mint',   text: 'text-primary',     label: 'Lluvia' },
}

export const AlertBadge = ({ type, className = '' }: AlertBadgeProps) => {
  const style = alertStyles[type]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-pill text-xs font-medium ${style.bg} ${style.text} ${className}`}>
      {style.label}
    </span>
  )
}
```

- [ ] **Step 4: Create WeatherWidget**

Create `apps/web/src/components/greenhouse/weather-widget.tsx`:
```tsx
import { Thermometer, Droplets, Wind } from 'lucide-react'
import type { WeatherResponse } from '@brotia/api'

type WeatherWidgetProps = {
  weather: WeatherResponse['current']
}

export const WeatherWidget = ({ weather }: WeatherWidgetProps) => (
  <div className="grid grid-cols-3 gap-3">
    {[
      { icon: Thermometer, value: `${weather.temperature_2m}°C`,  label: 'Temp.' },
      { icon: Droplets,    value: `${weather.relative_humidity_2m}%`, label: 'Humedad' },
      { icon: Wind,        value: `${weather.wind_speed_10m} km/h`, label: 'Viento' },
    ].map(({ icon: Icon, value, label }) => (
      <div key={label} className="bg-surface-alt rounded-md p-3 flex flex-col items-center gap-1">
        <Icon className="w-4 h-4 text-olive" />
        <span className="font-mono text-sm font-semibold text-foreground">{value}</span>
        <span className="text-xs text-subtle">{label}</span>
      </div>
    ))}
  </div>
)
```

- [ ] **Step 5: Create GreenhouseCard**

Create `apps/web/src/components/greenhouse/greenhouse-card.tsx`:
```tsx
import Link from 'next/link'
import { MapPin, Leaf } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { AlertBadge } from '@/components/ui/alert-badge'
import type { Greenhouse, WeatherAlert, Crop } from '@brotia/db'

type GreenhouseCardProps = {
  greenhouse: Greenhouse & {
    crops:  Pick<Crop, 'name'>[]
    alerts: Pick<WeatherAlert, 'type'>[]
  }
}

export const GreenhouseCard = ({ greenhouse }: GreenhouseCardProps) => (
  <Link href={`/greenhouse/${greenhouse.id}`}>
    <Card className="p-4 hover:shadow-md hover:border-primary/30 transition-all duration-200 cursor-pointer">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-heading font-semibold text-foreground">{greenhouse.name}</h3>
          <div className="flex items-center gap-1 mt-1">
            <MapPin className="w-3 h-3 text-subtle" />
            <span className="text-xs text-subtle font-mono">
              {greenhouse.lat.toFixed(4)}, {greenhouse.lng.toFixed(4)}
            </span>
          </div>
        </div>
        {greenhouse.area && (
          <span className="text-xs text-subtle bg-surface-alt px-2 py-1 rounded-sm">
            {greenhouse.area} m²
          </span>
        )}
      </div>

      {greenhouse.crops.length > 0 && (
        <div className="flex items-center gap-1.5 mb-3">
          <Leaf className="w-3.5 h-3.5 text-pea" />
          <span className="text-sm text-muted">{greenhouse.crops[0].name}</span>
        </div>
      )}

      {greenhouse.alerts.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {greenhouse.alerts.slice(0, 2).map((alert, i) => (
            <AlertBadge key={i} type={alert.type} />
          ))}
        </div>
      )}
    </Card>
  </Link>
)
```

- [ ] **Step 6: Create GreenhouseMap (dynamic import — MapLibre)**

Create `apps/web/src/components/greenhouse/greenhouse-map.tsx`:
```tsx
'use client'

import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { Greenhouse } from '@brotia/db'

type GreenhouseMapProps = {
  greenhouses: Pick<Greenhouse, 'id' | 'name' | 'lat' | 'lng'>[]
  height?: string
}

export const GreenhouseMap = ({ greenhouses, height = '300px' }: GreenhouseMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<maplibregl.Map | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style:     'https://tiles.openfreemap.org/styles/positron',
      center:    greenhouses.length > 0 ? [greenhouses[0].lng, greenhouses[0].lat] : [-3.7, 40.4],
      zoom:      greenhouses.length > 0 ? 10 : 6,
    })

    mapRef.current = map

    map.on('load', () => {
      greenhouses.forEach(gh => {
        const marker = new maplibregl.Marker({ color: '#2D5A1B' })
          .setLngLat([gh.lng, gh.lat])
          .setPopup(new maplibregl.Popup().setHTML(`<strong>${gh.name}</strong>`))
          .addTo(map)
      })
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [greenhouses])

  return (
    <div
      ref={containerRef}
      style={{ height }}
      className="w-full rounded-lg border border-border overflow-hidden"
    />
  )
}
```

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/components/
git commit -m "feat(web/ui): add UI components (Button, Card, AlertBadge, WeatherWidget, GreenhouseCard, GreenhouseMap)"
```

---

## Task 11: Web Pages

**Files:**
- Create: `apps/web/src/app/(dashboard)/layout.tsx`
- Create: `apps/web/src/app/(dashboard)/page.tsx`
- Create: `apps/web/src/app/(dashboard)/greenhouse/[id]/page.tsx`
- Create: `apps/web/src/app/(dashboard)/greenhouse/new/page.tsx`

- [ ] **Step 1: Create dashboard layout with sidebar**

Create `apps/web/src/app/(dashboard)/layout.tsx`:
```tsx
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { LayoutDashboard, Leaf, Bot, Settings } from 'lucide-react'

const navItems = [
  { href: '/',          icon: LayoutDashboard, label: 'Invernaderos' },
  { href: '/cultivos',  icon: Leaf,            label: 'Cultivos' },
  { href: '/chat',      icon: Bot,             label: 'Brotia IA' },
  { href: '/ajustes',   icon: Settings,        label: 'Ajustes' },
]

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-60 bg-surface border-r border-border flex flex-col p-4 gap-1">
        <div className="px-3 py-4 mb-2">
          <span className="font-heading font-bold text-xl text-primary">🌿 Brotia</span>
        </div>
        {navItems.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted hover:text-foreground hover:bg-surface-alt transition-colors"
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </aside>
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  )
}

export default DashboardLayout
```

- [ ] **Step 2: Create greenhouses list page**

Create `apps/web/src/app/(dashboard)/page.tsx`:
```tsx
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { db } from '@brotia/db'
import { GreenhouseCard } from '@/components/greenhouse/greenhouse-card'
import { Button } from '@/components/ui/button'
import dynamic from 'next/dynamic'

const GreenhouseMap = dynamic(
  () => import('@/components/greenhouse/greenhouse-map').then(m => m.GreenhouseMap),
  { ssr: false }
)

const GreenhousesPage = async () => {
  const session     = await auth()
  const greenhouses = await db.greenhouse.findMany({
    where:   { userId: session!.user!.id! },
    include: {
      crops:  { where: { status: 'GROWING' }, take: 1 },
      alerts: { where: { read: false }, take: 3 },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Mis Invernaderos</h1>
          <p className="text-sm text-muted mt-1">{greenhouses.length} invernadero{greenhouses.length !== 1 ? 's' : ''} registrado{greenhouses.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/greenhouse/new">
          <Button>+ Añadir invernadero</Button>
        </Link>
      </div>

      {greenhouses.length > 0 && (
        <div className="mb-6">
          <GreenhouseMap greenhouses={greenhouses} height="280px" />
        </div>
      )}

      {greenhouses.length === 0 ? (
        <div className="text-center py-16 text-muted">
          <p className="text-lg font-heading mb-2">Aún no tienes invernaderos</p>
          <p className="text-sm mb-6">Registra tu primer invernadero para ver el clima en tiempo real</p>
          <Link href="/greenhouse/new">
            <Button>Añadir mi primer invernadero</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {greenhouses.map(gh => (
            <GreenhouseCard key={gh.id} greenhouse={gh} />
          ))}
        </div>
      )}
    </div>
  )
}

export default GreenhousesPage
```

- [ ] **Step 3: Create greenhouse detail page**

Create `apps/web/src/app/(dashboard)/greenhouse/[id]/page.tsx`:
```tsx
import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@brotia/db'
import { getWeather, checkAlerts } from '@/lib/weather'
import { WeatherWidget } from '@/components/greenhouse/weather-widget'
import { AlertBadge } from '@/components/ui/alert-badge'
import { ArrowLeft, Leaf, StickyNote } from 'lucide-react'
import Link from 'next/link'

type Props = { params: Promise<{ id: string }> }

const GreenhouseDetailPage = async ({ params }: Props) => {
  const session = await auth()
  const { id }  = await params

  const greenhouse = await db.greenhouse.findFirst({
    where:   { id, userId: session!.user!.id! },
    include: {
      crops: { where: { status: 'GROWING' }, take: 1 },
      notes: { orderBy: { createdAt: 'desc' }, take: 3 },
    },
  })

  if (!greenhouse) notFound()

  const weather = await getWeather(greenhouse.lat, greenhouse.lng)
  const alerts  = checkAlerts(weather)

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> Mis invernaderos
      </Link>

      <div className="flex items-start justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">{greenhouse.name}</h1>
        {greenhouse.area && (
          <span className="text-sm text-subtle bg-surface-alt px-3 py-1 rounded-pill">{greenhouse.area} m²</span>
        )}
      </div>

      {alerts.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {alerts.map((a, i) => <AlertBadge key={i} type={a.type} />)}
        </div>
      )}

      <div className="mb-6">
        <h2 className="font-heading font-semibold text-sm text-muted uppercase tracking-wide mb-3">Clima actual</h2>
        <WeatherWidget weather={weather.current} />
      </div>

      {greenhouse.crops.length > 0 && (
        <div className="bg-surface border border-border rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Leaf className="w-4 h-4 text-pea" />
            <h2 className="font-heading font-semibold text-foreground">Cultivo activo</h2>
          </div>
          <p className="text-muted">{greenhouse.crops[0].name}</p>
        </div>
      )}

      {greenhouse.notes.length > 0 && (
        <div>
          <h2 className="font-heading font-semibold text-sm text-muted uppercase tracking-wide mb-3 flex items-center gap-2">
            <StickyNote className="w-4 h-4" /> Últimas anotaciones
          </h2>
          <div className="flex flex-col gap-2">
            {greenhouse.notes.map(note => (
              <div key={note.id} className="bg-surface-alt border border-border-subtle rounded-md p-3">
                <p className="text-sm text-foreground">{note.content}</p>
                <p className="text-xs text-subtle mt-1">{new Date(note.createdAt).toLocaleDateString('es-ES')}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default GreenhouseDetailPage
```

- [ ] **Step 4: Create add greenhouse page**

Create `apps/web/src/app/(dashboard)/greenhouse/new/page.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

const NewGreenhousePage = () => {
  const router  = useRouter()
  const [form,  setForm]    = useState({ name: '', lat: '', lng: '', area: '' })
  const [error, setError]   = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/greenhouses', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        name: form.name,
        lat:  parseFloat(form.lat),
        lng:  parseFloat(form.lng),
        area: form.area ? parseFloat(form.area) : undefined,
      }),
    })

    if (!res.ok) {
      const body = await res.json()
      setError(body.error?.fieldErrors?.name?.[0] ?? 'Error al crear el invernadero')
      setLoading(false)
      return
    }

    const greenhouse = await res.json()
    router.push(`/greenhouse/${greenhouse.id}`)
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="font-heading text-2xl font-bold text-foreground mb-6">Nuevo invernadero</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {[
          { name: 'name', label: 'Nombre',     type: 'text',   placeholder: 'Invernadero Norte', required: true },
          { name: 'lat',  label: 'Latitud',    type: 'number', placeholder: '37.3891',           required: true },
          { name: 'lng',  label: 'Longitud',   type: 'number', placeholder: '-5.9845',           required: true },
          { name: 'area', label: 'Superficie (m²)', type: 'number', placeholder: '500',          required: false },
        ].map(field => (
          <div key={field.name}>
            <label htmlFor={field.name} className="block text-sm font-medium text-foreground mb-1.5">
              {field.label}
            </label>
            <input
              id={field.name}
              name={field.name}
              type={field.type}
              step={field.type === 'number' ? 'any' : undefined}
              placeholder={field.placeholder}
              required={field.required}
              value={form[field.name as keyof typeof form]}
              onChange={e => setForm(prev => ({ ...prev, [field.name]: e.target.value }))}
              className="w-full bg-surface border border-border rounded-md px-3 py-2.5 text-sm text-foreground placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
            />
          </div>
        ))}

        {error && <p className="text-sm text-danger-text bg-danger rounded-md px-3 py-2">{error}</p>}

        <div className="flex gap-3 mt-2">
          <Button type="button" variant="ghost" onClick={() => router.back()}>Cancelar</Button>
          <Button type="submit" loading={loading} className="flex-1">Crear invernadero</Button>
        </div>
      </form>
    </div>
  )
}

export default NewGreenhousePage
```

- [ ] **Step 5: Run all tests**

```bash
cd apps/web && pnpm vitest run
```

Expected: all tests pass

- [ ] **Step 6: Test visually at localhost:3000**

```bash
pnpm dev
```

Verify:
1. `/login` muestra formulario con Google y email
2. `/` (autenticado) muestra lista + mapa
3. `/greenhouse/new` permite crear invernadero
4. `/greenhouse/[id]` muestra clima en tiempo real

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/app/\(dashboard\)/
git commit -m "feat(web/pages): add greenhouses list, detail, and add pages"
```

---

## Task 12: Expo Mobile App

**Files:**
- Create: `apps/mobile/package.json`
- Create: `apps/mobile/app.json`
- Create: `apps/mobile/tailwind.config.ts`
- Create: `apps/mobile/app/_layout.tsx`
- Create: `apps/mobile/app/(tabs)/index.tsx`
- Create: `apps/mobile/app/(tabs)/_layout.tsx`
- Create: `apps/mobile/lib/api.ts`
- Create: `apps/mobile/components/GreenhouseCard.tsx`

- [ ] **Step 1: Create Expo app**

```bash
cd apps
pnpm create expo-app mobile --template blank-typescript
cd mobile
```

- [ ] **Step 2: Install dependencies**

```bash
pnpm add @brotia/api
pnpm add nativewind
pnpm add expo-router expo-location
pnpm add react-native-maps
pnpm add lucide-react-native
pnpm add -D tailwindcss@3
```

- [ ] **Step 3: Configure NativeWind**

Create/replace `apps/mobile/tailwind.config.ts`:
```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background:     '#FAFCF7',
        surface:        '#FFFFFF',
        'surface-alt':  '#F2F7EE',
        primary:        '#2D5A1B',
        'primary-hover':'#3D7525',
        pea:            '#8DB84A',
        olive:          '#6B7C3D',
        sage:           '#A8C185',
        mint:           '#D4E6C3',
        foreground:     '#1C2E0F',
        muted:          '#4B6838',
        subtle:         '#7A9B6A',
        border:         '#C8DEB5',
        'border-subtle':'#E2EFDA',
        harvest:        '#CA8A04',
        frost:          '#BAE6FD',
        'frost-text':   '#0369A1',
        danger:         '#FEE2E2',
        'danger-text':  '#991B1B',
      },
      fontFamily: {
        heading: ['Outfit_600SemiBold'],
        body:    ['Inter_400Regular'],
        mono:    ['JetBrainsMono_400Regular'],
      },
    },
  },
}

export default config
```

- [ ] **Step 4: Create API client**

Create `apps/mobile/lib/api.ts`:
```ts
const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'

export const api = {
  greenhouses: {
    list: async () => {
      const res = await fetch(`${API_BASE}/api/greenhouses`, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to fetch greenhouses')
      return res.json()
    },
    get: async (id: string) => {
      const res = await fetch(`${API_BASE}/api/greenhouses/${id}`, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to fetch greenhouse')
      return res.json()
    },
    create: async (data: { name: string; lat: number; lng: number; area?: number }) => {
      const res = await fetch(`${API_BASE}/api/greenhouses`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(data),
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed to create greenhouse')
      return res.json()
    },
    weather: async (id: string) => {
      const res = await fetch(`${API_BASE}/api/greenhouses/${id}/weather`, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to fetch weather')
      return res.json()
    },
  },
}
```

- [ ] **Step 5: Create root layout with tab bar**

Create `apps/mobile/app/_layout.tsx`:
```tsx
import { Tabs } from 'expo-router'
import { LayoutDashboard, Leaf, Bot, Settings } from 'lucide-react-native'

const RootLayout = () => (
  <Tabs
    screenOptions={{
      tabBarActiveTintColor:   '#2D5A1B',
      tabBarInactiveTintColor: '#7A9B6A',
      tabBarStyle: {
        backgroundColor: '#FFFFFF',
        borderTopColor:  '#C8DEB5',
      },
      headerStyle:     { backgroundColor: '#FFFFFF' },
      headerTintColor: '#1C2E0F',
    }}
  >
    <Tabs.Screen
      name="(tabs)/index"
      options={{
        title: 'Invernaderos',
        tabBarIcon: ({ color }) => <LayoutDashboard size={22} color={color} />,
      }}
    />
    <Tabs.Screen
      name="(tabs)/crops"
      options={{
        title: 'Cultivos',
        tabBarIcon: ({ color }) => <Leaf size={22} color={color} />,
      }}
    />
    <Tabs.Screen
      name="(tabs)/chat"
      options={{
        title: 'Brotia IA',
        tabBarIcon: ({ color }) => <Bot size={22} color={color} />,
      }}
    />
    <Tabs.Screen
      name="(tabs)/settings"
      options={{
        title: 'Ajustes',
        tabBarIcon: ({ color }) => <Settings size={22} color={color} />,
      }}
    />
  </Tabs>
)

export default RootLayout
```

- [ ] **Step 6: Create GreenhouseCard component**

Create `apps/mobile/components/GreenhouseCard.tsx`:
```tsx
import { TouchableOpacity, View, Text } from 'react-native'
import { useRouter } from 'expo-router'
import { MapPin, Leaf } from 'lucide-react-native'

type Props = {
  id:    string
  name:  string
  lat:   number
  lng:   number
  area?: number | null
  activeCropName?: string
  alertCount?: number
}

export const GreenhouseCard = ({ id, name, lat, lng, area, activeCropName, alertCount = 0 }: Props) => {
  const router = useRouter()

  return (
    <TouchableOpacity
      className="bg-surface border border-border rounded-2xl p-4 mb-3 active:opacity-80"
      onPress={() => router.push(`/greenhouse/${id}`)}
      activeOpacity={0.8}
    >
      <View className="flex-row items-start justify-between mb-2">
        <Text className="font-heading text-base font-semibold text-foreground">{name}</Text>
        {area && (
          <Text className="text-xs text-subtle bg-surface-alt px-2 py-0.5 rounded-full">{area} m²</Text>
        )}
      </View>

      <View className="flex-row items-center gap-1 mb-2">
        <MapPin size={12} color="#7A9B6A" />
        <Text className="text-xs text-subtle font-mono">{lat.toFixed(4)}, {lng.toFixed(4)}</Text>
      </View>

      {activeCropName && (
        <View className="flex-row items-center gap-1.5">
          <Leaf size={14} color="#8DB84A" />
          <Text className="text-sm text-muted">{activeCropName}</Text>
        </View>
      )}

      {alertCount > 0 && (
        <View className="mt-2 bg-frost rounded-full px-2 py-0.5 self-start">
          <Text className="text-xs text-frost-text">{alertCount} alerta{alertCount > 1 ? 's' : ''}</Text>
        </View>
      )}
    </TouchableOpacity>
  )
}
```

- [ ] **Step 7: Create greenhouses tab screen**

Create `apps/mobile/app/(tabs)/index.tsx`:
```tsx
import { useEffect, useState } from 'react'
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { Plus } from 'lucide-react-native'
import { GreenhouseCard } from '@/components/GreenhouseCard'
import { api } from '@/lib/api'

type Greenhouse = {
  id:       string
  name:     string
  lat:      number
  lng:      number
  area:     number | null
  crops:    { name: string }[]
  alerts:   { type: string }[]
}

const GreenhousesScreen = () => {
  const router = useRouter()
  const [greenhouses, setGreenhouses] = useState<Greenhouse[]>([])
  const [refreshing,  setRefreshing]  = useState(false)
  const [loading,     setLoading]     = useState(true)

  const fetchGreenhouses = async () => {
    try {
      const data = await api.greenhouses.list()
      setGreenhouses(data)
    } catch {
      // empty state shown below
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { fetchGreenhouses() }, [])

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
        <Text className="font-heading text-xl font-bold text-foreground">Mis Invernaderos</Text>
        <TouchableOpacity
          className="bg-primary rounded-full w-9 h-9 items-center justify-center"
          onPress={() => router.push('/greenhouse/new')}
        >
          <Plus size={18} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchGreenhouses() }} />}
      >
        {!loading && greenhouses.length === 0 && (
          <View className="items-center py-16">
            <Text className="font-heading text-base text-muted mb-2">Sin invernaderos aún</Text>
            <Text className="text-sm text-subtle text-center">Pulsa + para registrar tu primer invernadero</Text>
          </View>
        )}
        {greenhouses.map(gh => (
          <GreenhouseCard
            key={gh.id}
            id={gh.id}
            name={gh.name}
            lat={gh.lat}
            lng={gh.lng}
            area={gh.area}
            activeCropName={gh.crops[0]?.name}
            alertCount={gh.alerts.length}
          />
        ))}
      </ScrollView>
    </View>
  )
}

export default GreenhousesScreen
```

- [ ] **Step 8: Create placeholder tab screens**

Create `apps/mobile/app/(tabs)/crops.tsx`:
```tsx
import { View, Text } from 'react-native'

const CropsScreen = () => (
  <View className="flex-1 bg-background items-center justify-center">
    <Text className="text-muted">Cultivos — Fase 2</Text>
  </View>
)

export default CropsScreen
```

Create `apps/mobile/app/(tabs)/chat.tsx`:
```tsx
import { View, Text } from 'react-native'

const ChatScreen = () => (
  <View className="flex-1 bg-background items-center justify-center">
    <Text className="text-muted">Brotia IA — Fase 2</Text>
  </View>
)

export default ChatScreen
```

Create `apps/mobile/app/(tabs)/settings.tsx`:
```tsx
import { View, Text } from 'react-native'

const SettingsScreen = () => (
  <View className="flex-1 bg-background items-center justify-center">
    <Text className="text-muted">Ajustes — Fase 2</Text>
  </View>
)

export default SettingsScreen
```

- [ ] **Step 9: Create greenhouse detail screen (mobile)**

Create `apps/mobile/app/greenhouse/[id].tsx`:
```tsx
import { useEffect, useState } from 'react'
import { View, Text, ScrollView, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, Stack } from 'expo-router'
import { Thermometer, Droplets, Wind } from 'lucide-react-native'
import { api } from '@/lib/api'

type Weather = { temperature_2m: number; relative_humidity_2m: number; wind_speed_10m: number }

const GreenhouseDetailScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [data,    setData]    = useState<{ weather: { current: Weather }; alerts: { type: string; message: string }[] } | null>(null)
  const [name,    setName]    = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const [gh, weatherData] = await Promise.all([
        api.greenhouses.get(id),
        api.greenhouses.weather(id),
      ])
      setName(gh.name)
      setData(weatherData)
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#2D5A1B" />
      </View>
    )
  }

  return (
    <>
      <Stack.Screen options={{ title: name }} />
      <ScrollView className="flex-1 bg-background px-4 pt-4">
        {data?.alerts.map((alert, i) => (
          <View key={i} className="bg-frost rounded-full px-3 py-1 mb-2 self-start">
            <Text className="text-frost-text text-xs">{alert.message}</Text>
          </View>
        ))}

        <Text className="font-heading font-semibold text-sm text-muted uppercase tracking-wider mb-3">Clima actual</Text>

        <View className="flex-row gap-3 mb-6">
          {[
            { icon: Thermometer, value: `${data?.weather.current.temperature_2m}°C`, label: 'Temp.' },
            { icon: Droplets,    value: `${data?.weather.current.relative_humidity_2m}%`, label: 'Humedad' },
            { icon: Wind,        value: `${data?.weather.current.wind_speed_10m} km/h`, label: 'Viento' },
          ].map(({ icon: Icon, value, label }) => (
            <View key={label} className="flex-1 bg-surface-alt rounded-2xl p-3 items-center gap-1">
              <Icon size={16} color="#6B7C3D" />
              <Text className="font-mono text-sm font-semibold text-foreground">{value}</Text>
              <Text className="text-xs text-subtle">{label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </>
  )
}

export default GreenhouseDetailScreen
```

- [ ] **Step 10: Create add greenhouse screen (mobile)**

Create `apps/mobile/app/greenhouse/new.tsx`:
```tsx
import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native'
import { useRouter, Stack } from 'expo-router'
import * as Location from 'expo-location'
import { MapPin } from 'lucide-react-native'
import { api } from '@/lib/api'

const NewGreenhouseScreen = () => {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', lat: '', lng: '', area: '' })
  const [loading, setLoading] = useState(false)

  const detectLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Activa la ubicación para detectarla automáticamente')
      return
    }
    const loc = await Location.getCurrentPositionAsync({})
    setForm(prev => ({
      ...prev,
      lat: loc.coords.latitude.toFixed(6),
      lng: loc.coords.longitude.toFixed(6),
    }))
  }

  const handleSubmit = async () => {
    if (!form.name || !form.lat || !form.lng) {
      Alert.alert('Campos requeridos', 'Nombre, latitud y longitud son obligatorios')
      return
    }
    setLoading(true)
    try {
      const gh = await api.greenhouses.create({
        name: form.name,
        lat:  parseFloat(form.lat),
        lng:  parseFloat(form.lng),
        area: form.area ? parseFloat(form.area) : undefined,
      })
      router.replace(`/greenhouse/${gh.id}`)
    } catch {
      Alert.alert('Error', 'No se pudo crear el invernadero. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Nuevo invernadero' }} />
      <ScrollView className="flex-1 bg-background px-4 pt-4">
        {[
          { key: 'name', label: 'Nombre',          placeholder: 'Invernadero Norte', keyboardType: 'default' },
          { key: 'area', label: 'Superficie (m²)',  placeholder: '500',               keyboardType: 'numeric'  },
        ].map(field => (
          <View key={field.key} className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-1.5">{field.label}</Text>
            <TextInput
              className="bg-surface border border-border rounded-xl px-3 py-3 text-sm text-foreground"
              placeholder={field.placeholder}
              placeholderTextColor="#7A9B6A"
              value={form[field.key as keyof typeof form]}
              onChangeText={v => setForm(prev => ({ ...prev, [field.key]: v }))}
              keyboardType={field.keyboardType as any}
            />
          </View>
        ))}

        <View className="mb-4">
          <Text className="text-sm font-medium text-foreground mb-1.5">Ubicación GPS</Text>
          <TouchableOpacity
            className="bg-surface-alt border border-border rounded-xl px-3 py-3 flex-row items-center gap-2 mb-2"
            onPress={detectLocation}
          >
            <MapPin size={16} color="#2D5A1B" />
            <Text className="text-sm text-primary font-medium">Detectar mi ubicación</Text>
          </TouchableOpacity>
          <View className="flex-row gap-2">
            {['lat', 'lng'].map(key => (
              <TextInput
                key={key}
                className="flex-1 bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-foreground font-mono"
                placeholder={key === 'lat' ? 'Latitud' : 'Longitud'}
                placeholderTextColor="#7A9B6A"
                value={form[key as 'lat' | 'lng']}
                onChangeText={v => setForm(prev => ({ ...prev, [key]: v }))}
                keyboardType="numbers-and-punctuation"
              />
            ))}
          </View>
        </View>

        <TouchableOpacity
          className={`bg-primary rounded-xl py-3.5 items-center mt-4 mb-8 ${loading ? 'opacity-60' : ''}`}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text className="text-white font-semibold text-sm">
            {loading ? 'Creando...' : 'Crear invernadero'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  )
}

export default NewGreenhouseScreen
```

- [ ] **Step 11: Test on simulator**

```bash
cd apps/mobile
pnpm expo start
```

Press `i` for iOS simulator or `a` for Android emulator.

Verify:
1. Tab bar aparece con 4 tabs
2. Lista de invernaderos muestra empty state
3. Botón + navega a pantalla de creación
4. "Detectar mi ubicación" rellena lat/lng automáticamente

- [ ] **Step 12: Commit**

```bash
git add apps/mobile/
git commit -m "feat(mobile): scaffold Expo app with NativeWind, tab navigation, greenhouse list/detail/add screens"
```

---

## Task 13: Deployment

**Files:**
- Create: `apps/web/.env.production`

- [ ] **Step 1: Run all tests**

```bash
pnpm turbo run test
```

Expected: all tests pass across all packages.

- [ ] **Step 2: Run TypeScript check**

```bash
pnpm turbo run build
```

Expected: no TypeScript errors.

- [ ] **Step 3: Deploy web to Vercel**

```bash
cd apps/web
npx vercel --prod
```

During setup:
- Link to existing project or create new
- Set environment variables in Vercel dashboard (copy from `.env`)
- Verify `DATABASE_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_RESEND_KEY`, `ANTHROPIC_API_KEY`, `BLOB_READ_WRITE_TOKEN`, `CRON_SECRET`

- [ ] **Step 4: Update mobile API URL**

Create `apps/mobile/.env`:
```bash
EXPO_PUBLIC_API_URL=https://brotia.vercel.app
```

- [ ] **Step 5: Build mobile with EAS**

```bash
cd apps/mobile
npx eas build --platform all --profile preview
```

Expected: iOS `.ipa` and Android `.apk` build links.

- [ ] **Step 6: Final commit**

```bash
git add .
git commit -m "feat: Brotia MVP complete — greenhouses + real-time weather on web and mobile"
```

---

## Checklist Final MVP

- [ ] Monorepo Turborepo funciona (`pnpm dev` levanta web y mobile)
- [ ] Design tokens centralizados en `packages/config/tokens.css`
- [ ] Schema Prisma aplicado en Neon
- [ ] Login con Google + email funciona
- [ ] CRUD invernaderos funciona (web)
- [ ] Clima en tiempo real por invernadero (Open-Meteo)
- [ ] Alertas meteorológicas detectadas (helada, viento, humedad)
- [ ] Cron job configurado en Vercel (cada hora)
- [ ] App móvil Expo arranca con NativeWind
- [ ] Greenhouses list funciona en móvil
- [ ] Tests pasan: `pnpm turbo run test`
- [ ] TypeScript: 0 errores: `pnpm turbo run build`
- [ ] Deployed: web en Vercel, mobile EAS build generado
