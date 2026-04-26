# Brotia — Design Spec
**Date:** 2026-04-26  
**Status:** Approved  
**Stack:** Next.js 15 + Expo SDK 52 + Neon PostgreSQL + Claude API + Open-Meteo

---

## 1. Visión del Producto

Brotia es una app para agricultores que les permite gestionar sus invernaderos geolocalizados, consultar el clima en tiempo real por ubicación, registrar cultivos y recibir alertas meteorológicas. Incluye un asistente IA agrícola con capacidad de análisis de fotos de plantas.

**MVP:** Registro de invernaderos geolocalizados + clima en tiempo real por invernadero.

**Plataformas:** Web (Next.js) + Móvil iOS/Android (Expo).

**Usuarios objetivo:** Agricultores con invernaderos en España, habla hispana.

---

## 2. Arquitectura

### Monorepo Turborepo

```
brotia/ (Turborepo)
├── apps/
│   ├── web/          → Next.js 15, App Router, Tailwind CSS v4
│   └── mobile/       → Expo SDK 52, Expo Router v4, NativeWind v4
│
└── packages/
    ├── db/           → Prisma 6 + Neon (server-side only)
    ├── api/          → Zod schemas + TypeScript types compartidos
    └── config/       → tailwind.config, tsconfig base, tokens CSS
```

### Flujo de datos

```
Mobile/Web → Next.js API Routes → Prisma → Neon PostgreSQL
                    ↓
              Open-Meteo API (clima por coordenadas GPS)
                    ↓
              Claude API claude-opus-4-7 (chat IA + análisis fotos)
```

### Deployments

| Servicio | Plataforma |
|----------|-----------|
| `apps/web` | Vercel (auto desde `main`) |
| `apps/mobile` | Expo EAS Build (iOS + Android) |
| Base de datos | Neon serverless PostgreSQL |
| Fotos/imágenes | Vercel Blob |
| Cron alertas | Vercel Cron Jobs (cada hora) |

---

## 3. Design System

### Tokens de color (`packages/config/tokens.css`)

```css
@theme inline {
  /* Backgrounds */
  --color-background:     #FAFCF7;
  --color-surface:        #FFFFFF;
  --color-surface-alt:    #F2F7EE;
  --color-surface-raised: #E8F2DF;

  /* Verdes principales */
  --color-primary:        #2D5A1B;
  --color-primary-hover:  #3D7525;
  --color-primary-light:  #5A9E3E;

  /* Verdes secundarios */
  --color-pea:            #8DB84A;
  --color-olive:          #6B7C3D;
  --color-sage:           #A8C185;
  --color-mint:           #D4E6C3;

  /* Textos */
  --color-foreground:     #1C2E0F;
  --color-muted:          #4B6838;
  --color-subtle:         #7A9B6A;

  /* Bordes */
  --color-border:         #C8DEB5;
  --color-border-subtle:  #E2EFDA;

  /* Alertas semánticas */
  --color-frost:          #BAE6FD;
  --color-frost-text:     #0369A1;
  --color-hail:           #C7D2FE;
  --color-hail-text:      #3730A3;
  --color-wind:           #FEF3C7;
  --color-wind-text:      #92400E;
  --color-danger:         #FEE2E2;
  --color-danger-text:    #991B1B;

  /* Acento CTA */
  --color-harvest:        #CA8A04;
  --color-harvest-hover:  #A16207;

  /* Radios orgánicos */
  --radius-sm:   8px;
  --radius-md:   16px;
  --radius-lg:   24px;
  --radius-pill: 999px;

  /* Sombras naturales */
  --shadow-sm:  0 1px 4px rgba(45, 90, 27, 0.08);
  --shadow-md:  0 4px 16px rgba(45, 90, 27, 0.12);
  --shadow-lg:  0 8px 32px rgba(45, 90, 27, 0.16);
}
```

### Tipografía

| Rol | Fuente | Uso |
|-----|--------|-----|
| Heading | Outfit | Títulos, nombres de invernadero |
| Body | Inter | Textos, datos, formularios |
| Mono | JetBrains Mono | Datos técnicos (temperaturas, coordenadas) |

### Estilo visual

- **Organic Biophilic** — esquinas redondeadas (16-24px), sombras naturales
- Border-radius variado (no uniforme) para sensación orgánica
- Sin emojis como iconos — usar Lucide Icons exclusivamente
- Imágenes con tono verde suave en overlays

---

## 4. Modelo de Datos (Prisma)

```prisma
model User {
  id           String       @id @default(cuid())
  email        String       @unique
  name         String?
  avatar       String?
  provider     String?      // "google" | "apple" | "email"
  createdAt    DateTime     @default(now())
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

enum CropStatus { GROWING  HARVESTED  FAILED }

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

enum AlertType { FROST  HAIL  STRONG_WIND  HIGH_HUMIDITY  RAIN_EXPECTED }

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

---

## 5. API Routes

```
apps/web/src/app/api/
├── auth/[...nextauth]/route.ts
├── greenhouses/
│   ├── route.ts                  GET (lista) · POST (crear)
│   └── [id]/
│       ├── route.ts              GET · PUT · DELETE
│       └── weather/route.ts      GET clima + previsión 7 días
├── crops/
│   ├── route.ts                  GET · POST
│   └── [id]/route.ts             GET · PUT · DELETE
├── notes/route.ts                POST (texto + fotos Vercel Blob)
├── alerts/check/route.ts         POST (Vercel Cron, cada hora)
└── chat/route.ts                 POST streaming (Claude API)
```

---

## 6. Integraciones

### Open-Meteo (clima)

- **URL base:** `https://api.open-meteo.com/v1/forecast`
- **Sin API key** — gratuito, sin límites prácticos
- **Cache:** `next: { revalidate: 3600 }` (1 hora)
- **Variables consultadas:** `temperature_2m`, `relative_humidity_2m`, `wind_speed_10m`, `precipitation`, `precipitation_probability`
- **Previsión:** 7 días con datos horarios

**Lógica de alertas (cron cada hora):**
- `temperature_2m < 2°C` → alerta `FROST`
- `wind_speed_10m > 60 km/h` → alerta `STRONG_WIND`
- `precipitation_probability > 80%` → alerta `RAIN_EXPECTED`
- `relative_humidity_2m > 90%` → alerta `HIGH_HUMIDITY`
- `precipitation_probability > 70% AND showers_sum > 0` → alerta `HAIL` (Open-Meteo campo `showers_sum` indica convectiva)

### Claude API (IA agrícola)

- **Modelo:** `claude-opus-4-7`
- **Modo:** streaming con `messages.stream()`
- **System prompt:** contexto del agricultor + invernaderos activos
- **Multimodal:** acepta imágenes base64 para análisis de plantas
- **Idioma:** siempre responde en español

### Autenticación (NextAuth v5)

- **Providers:** Google OAuth, Apple OAuth, Resend magic link (email)
- **Adapter:** PrismaAdapter → sesiones en Neon
- **Email from:** `brotia@brotia.app`

---

## 7. Navegación

### Móvil (Tab Bar)
```
Tab 1: Mis Invernaderos   → lista + mapa interactivo
Tab 2: Clima              → detalle meteorológico por invernadero
Tab 3: Cultivos           → registro y calendario
Tab 4: Brotia IA          → chat + análisis de fotos
Tab 5: Ajustes            → perfil, notificaciones, cuenta
```

### Web (Sidebar)
Misma estructura, layout sidebar en desktop, bottom navigation en móvil web.

---

## 8. Pantallas MVP

1. **Mis Invernaderos** — mapa + lista de cards con temperatura/humedad/viento actuales
2. **Detalle Invernadero** — clima actual, previsión 48h, cultivo activo, últimas anotaciones
3. **Añadir Invernadero** — nombre, ubicación GPS (mapa interactivo), superficie
4. **Chat IA Brotia** — interfaz conversacional, botón de cámara para subir fotos
5. **Análisis de planta** — upload foto → respuesta Claude con diagnóstico

---

## 9. Pantallas Fase 2 (post-MVP)

| Pantalla | Descripción |
|----------|-------------|
| Calendario cultivos | Vista mensual siembra/cosecha con recordatorios |
| Registro de plagas | Fotos + nombre plaga + severidad por cultivo |
| Tratamientos | Productos fitosanitarios + alerta período de seguridad |
| Estadísticas | Gráficas rendimiento kg/temporada por invernadero |
| Centro de alertas | Historial de alertas meteorológicas |
| Comunidad | Foro por zona geográfica y tipo de cultivo |
| Exportar PDF | Informe para cooperativas y seguros agrarios |

---

## 10. Variables de Entorno

```bash
# Base de datos
DATABASE_URL=               # Neon connection string

# Auth
AUTH_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
AUTH_APPLE_ID=
AUTH_APPLE_SECRET=
AUTH_RESEND_KEY=            # Magic link email

# IA
ANTHROPIC_API_KEY=          # Claude API

# Storage
BLOB_READ_WRITE_TOKEN=      # Vercel Blob (fotos plantas)

# Open-Meteo no necesita API key
```

---

## 11. Fases de Desarrollo

### Fase 1 — MVP (semanas 1-4)
- Setup Turborepo + Next.js + Expo
- Design system + tokens CSS en `packages/config`
- Auth (Google + Apple + email)
- CRUD invernaderos con geolocalización
- Integración Open-Meteo por invernadero
- Cards de clima en tiempo real

### Fase 2 — IA y cultivos (semanas 5-8)
- Chat IA con Claude API (streaming)
- Análisis de fotos de plantas
- Registro de cultivos + calendario
- Alertas meteorológicas (cron job)
- Notificaciones push (Expo Notifications)

### Fase 3 — Gestión avanzada (semanas 9-12)
- Control de plagas y tratamientos
- Período de seguridad fitosanitario
- Estadísticas y gráficas (Recharts)
- Historial por temporada

### Fase 4 — Comunidad e integraciones (semanas 13-16)
- Foro por zona/cultivo
- Exportación PDF (react-pdf)
- Integración estaciones Davis/Netatmo
- Compatibilidad de cultivos

---

## 12. Dependencias Principales

| Paquete | Versión | Uso |
|---------|---------|-----|
| next | 15.x | Framework web |
| expo | ~52.x | Framework móvil |
| @prisma/client | 6.x | ORM |
| @prisma/adapter-neon | 6.x | Adapter Neon |
| next-auth | 5.x | Autenticación |
| @anthropic-ai/sdk | latest | Claude API |
| zod | 3.x | Validación schemas |
| nativewind | 4.x | Tailwind en Expo |
| @vercel/blob | latest | Storage fotos |
| recharts | 2.x | Gráficas estadísticas |
| lucide-react | latest | Iconos web |
| lucide-react-native | latest | Iconos móvil |
| react-native-maps | 1.x | Mapa en Expo (iOS/Android) |
| react-map-gl | 7.x | Mapa en Next.js (MapLibre GL) |
