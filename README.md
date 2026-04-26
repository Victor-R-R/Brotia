# Brotia

Greenhouse management platform. Track your greenhouses, crops, weather conditions, and automated climate alerts from a single dashboard.

## What it does

- **Greenhouse management** — Register multiple greenhouses with GPS coordinates and area. Visualize them all on an interactive map.
- **Crop tracking** — Track crops from planting to harvest. Record yield, status (`GROWING`, `HARVESTED`, `FAILED`), and expected harvest dates.
- **Notes & field records** — Attach notes with photos to greenhouses or individual crops. Log pest detections and phytosanitary treatments with safety intervals.
- **Weather monitoring** — Per-greenhouse live weather data (temperature, humidity, wind, precipitation) via [Open-Meteo](https://open-meteo.com/).
- **Automated alerts** — Hourly cron job checks weather for every registered greenhouse and creates alerts for: frost, hail risk, strong winds, high humidity, and incoming rain.
- **Mobile app** — Companion Expo app with location access for on-site use.

## Alert types

| Alert | Trigger |
|---|---|
| `FROST` | Temperature < 2 °C (high severity below 0 °C) |
| `STRONG_WIND` | Wind > 60 km/h (high severity above 90 km/h) |
| `HIGH_HUMIDITY` | Humidity > 90% |
| `RAIN_EXPECTED` | > 80% precipitation probability in next 12 h |
| `HAIL` | > 70% precip probability + convective showers detected |

## Tech stack

| Layer | Technology |
|---|---|
| Web framework | Next.js 16 + React 19 |
| Mobile | Expo 54 + React Native 0.81 |
| Styling | Tailwind CSS v4 |
| Auth | NextAuth v5 — Google OAuth + Resend (magic link) |
| Database | PostgreSQL via [Neon](https://neon.tech) (serverless) |
| ORM | Prisma 6 + `@prisma/adapter-neon` |
| Map | MapLibre GL 5 + react-map-gl |
| Weather | Open-Meteo API (free, no key required) |
| Monorepo | Turborepo + pnpm |
| Testing | Vitest + Testing Library |
| Deployment | Vercel (cron jobs for alert detection) |

## Project structure

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

## Getting started

### Prerequisites

- Node.js 20+
- pnpm 9+
- A Neon database (or any PostgreSQL instance)
- Google OAuth credentials
- Resend API key (email magic links)

### Environment variables

Create `apps/web/.env.local`:

```env
DATABASE_URL=postgresql://...

AUTH_SECRET=...
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...

RESEND_API_KEY=...
AUTH_RESEND_FROM=noreply@yourdomain.com

CRON_SECRET=...          # Shared secret for the alerts cron endpoint
```

### Install and run

```bash
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

## API routes

```
GET  /api/greenhouses                   List user's greenhouses
POST /api/greenhouses                   Create a greenhouse
GET  /api/greenhouses/:id               Get greenhouse with crops, notes, alerts
PUT  /api/greenhouses/:id               Update a greenhouse
DEL  /api/greenhouses/:id               Delete a greenhouse
GET  /api/greenhouses/:id/weather       Current weather + alert check
POST /api/alerts/check                  Cron endpoint — checks all greenhouses (Bearer CRON_SECRET)
```

## Deployment

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
