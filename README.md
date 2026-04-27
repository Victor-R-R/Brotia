<div align="center">

# 🌿 Brotia

**Greenhouse management platform for modern farmers.**  
Track your greenhouses, crops, weather, and automated climate alerts — all in one place.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)](https://nextjs.org)
[![Expo](https://img.shields.io/badge/Expo-54-000020?logo=expo)](https://expo.dev)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma)](https://prisma.io)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-Apache%202.0-green)](./LICENSE)

</div>

---

## ✨ Features

| | Feature | Description |
|---|---|---|
| 🏡 | **Greenhouse management** | Register greenhouses with GPS coordinates and area. View them all on an interactive map. |
| 🌱 | **Crop tracking** | Track crops from planting to harvest — yield, status, and expected harvest dates. |
| 📝 | **Notes & field records** | Attach notes with photos to greenhouses or crops. Log pest detections and treatments. |
| 🌤️ | **Live weather** | Per-greenhouse real-time weather via [Open-Meteo](https://open-meteo.com/) (free, no key needed). |
| 🚨 | **Automated alerts** | Hourly cron checks weather for every greenhouse and creates severity-rated alerts. |
| 📊 | **Statistics dashboard** | Interactive charts for harvest production by month, crop, and greenhouse — with multi-greenhouse filtering and inter-year comparison. |
| 🤖 | **AI agricultural advisor** | Chat with Brotia IA — an expert agronomic assistant specialized in Spain. Identifies pests, diseases, and gives treatment recommendations. Supports image upload. Conversation history persisted per user. |
| 📱 | **Mobile app** | Expo companion app with location access, crop tracking, and full AI chat on-site. |
| 🛡️ | **Admin panel** | Superadmin dashboard with user management and role assignment. Mobile-accessible via bottom nav. |

---

## 🚨 Alert types

| Alert | Trigger | Severity |
|---|---|---|
| 🧊 `FROST` | Temperature < 2 °C | Medium · High below 0 °C |
| 💨 `STRONG_WIND` | Wind > 60 km/h | Medium · High above 90 km/h |
| 💧 `HIGH_HUMIDITY` | Humidity > 90% | Low |
| 🌧️ `RAIN_EXPECTED` | > 80% precip probability in next 12 h | Low |
| ⛈️ `HAIL` | > 70% precip + convective showers detected | High |

---

## 🛠️ Tech stack

| Layer | Technology |
|---|---|
| 🌐 Web | Next.js 16 + React 19 |
| 📱 Mobile | Expo 54 + React Native 0.81 |
| 🎨 Styling | Tailwind CSS v4 |
| 🔐 Auth | NextAuth v5 — Google OAuth + email/password (bcrypt) |
| 🗄️ Database | PostgreSQL via [Neon](https://neon.tech) (serverless) |
| 🔷 ORM | Prisma 6 + `@prisma/adapter-neon` |
| 🗺️ Map | MapLibre GL 5 + react-map-gl |
| ☁️ Weather | Open-Meteo API |
| 📦 Monorepo | Turborepo + pnpm |
| 🧪 Testing | Vitest + Testing Library |
| 🚀 Deployment | Vercel (cron jobs for hourly alert detection) |

---

## 📁 Project structure

```
brotia/
├── apps/
│   ├── web/          # Next.js dashboard
│   └── mobile/       # Expo companion app
└── packages/
    ├── api/          # Zod validation schemas (shared)
    ├── db/           # Prisma client + Neon adapter
    └── config/       # Shared TypeScript / ESLint config
```

---

## 🚀 Getting started

### Prerequisites

- Node.js 20+
- pnpm 9+
- A [Neon](https://neon.tech) database (or any PostgreSQL instance)
- Google OAuth credentials
- [Resend](https://resend.com) API key (welcome emails)
- [Anthropic](https://anthropic.com) API key (AI chat)

### Environment variables

Create `apps/web/.env.local`:

```env
DATABASE_URL=postgresql://...

AUTH_SECRET=...
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...

AUTH_RESEND_KEY=...       # Resend SDK — welcome emails on registration

ANTHROPIC_API_KEY=...     # AI chat feature

CRON_SECRET=...           # Shared secret for the alerts cron endpoint
```

### Install and run

```bash
# Install dependencies
pnpm install

# Push schema to the database
pnpm --filter @brotia/db db:push

# Start all apps in development
pnpm dev
```

The web app runs on `http://localhost:3000`.

### Run tests

```bash
pnpm test
```

---

## 🔌 API routes

```
GET  /api/greenhouses                   List user's greenhouses
POST /api/greenhouses                   Create a greenhouse
GET  /api/greenhouses/:id               Get greenhouse with crops, notes, alerts
PUT  /api/greenhouses/:id               Update a greenhouse
DEL  /api/greenhouses/:id               Delete a greenhouse
GET  /api/greenhouses/:id/weather       Current weather + alert check
POST /api/alerts/check                  Cron endpoint — checks all greenhouses (Bearer CRON_SECRET)
GET  /api/conversations                 List user's chat conversations
POST /api/conversations                 Create a new conversation
GET  /api/conversations/:id             Get messages for a conversation
DEL  /api/conversations/:id             Delete a conversation and its messages
POST /api/chat                          Streaming AI chat (Anthropic claude-sonnet-4-6)
GET  /api/crops                         List user's crops
POST /api/crops                         Create a crop
GET  /api/estadisticas                  Dashboard stats — greenhouse count, crop status, harvest totals, alert breakdown
GET  /api/admin/users                   List all users (SUPERADMIN only)
PATCH /api/admin/users/:id/role         Update user role (SUPERADMIN only)
```

---

## 🔒 Security

| Layer | Mechanism |
|---|---|
| **Session auth** | JWT via NextAuth v5 — every dashboard route checks `session.user.id` server-side |
| **Password storage** | bcrypt — plaintext passwords never stored |
| **Admin access** | Role `SUPERADMIN` baked into JWT at login — admin routes return 403 for any other role |
| **Cron endpoint** | `POST /api/alerts/check` requires `Authorization: Bearer CRON_SECRET` |
| **Data isolation** | All DB queries are scoped to `session.user.id` — users can only access their own data |
| **Input validation** | Zod schemas on all API inputs via `@brotia/api` |
| **Secrets** | All credentials in environment variables — never committed to the repo |

---

## ☁️ Deployment

Deploy to Vercel. Set all environment variables in the project settings.

Configure the alerts cron in `vercel.json`:

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

The cron fires every hour and creates alerts for any greenhouse with dangerous weather conditions.
