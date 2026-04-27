import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Leaf, FileText, Wind } from 'lucide-react'
import { auth } from '@/lib/auth'
import { db } from '@brotia/db'
import type { Note } from '@brotia/db'
import { getWeather, checkAlerts } from '@/lib/weather'
import { WeatherWidget } from '@/components/greenhouse/weather-widget'
import { AlertBadge } from '@/components/ui/alert-badge'
import { GreenhouseActions } from '@/components/greenhouse/greenhouse-actions'

const wmoIcon = (code: number): string => {
  if (code === 0)               return '☀️'
  if (code <= 2)                return '🌤️'
  if (code <= 3)                return '☁️'
  if (code <= 49)               return '🌫️'
  if (code <= 59)               return '🌦️'
  if (code <= 69)               return '🌧️'
  if (code <= 79)               return '🌨️'
  if (code <= 84)               return '🌧️'
  if (code <= 99)               return '⛈️'
  return '🌡️'
}

type Props = {
  params: Promise<{ id: string }>
}

const GreenhouseDetailPage = async ({ params }: Props) => {
  const { id } = await params

  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const greenhouse = await db.greenhouse.findFirst({
    where:   { id, userId: session.user.id },
    include: {
      crops: { where: { status: 'GROWING' }, take: 1 },
      notes: { orderBy: { createdAt: 'desc' }, take: 3 },
    },
  })

  if (!greenhouse) notFound()

  let weather: Awaited<ReturnType<typeof getWeather>> | null = null
  let alerts:  ReturnType<typeof checkAlerts> = []

  try {
    weather = await getWeather(greenhouse.lat, greenhouse.lng)
    alerts  = checkAlerts(weather)
  } catch {
    // Open-Meteo indisponible — afficher un état vide
  }

  return (
    <div className="max-w-3xl">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="size-4" />
        Mis invernaderos
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">{greenhouse.name}</h1>
          {greenhouse.area ? (
            <span className="inline-block mt-1 text-xs text-subtle bg-surface-alt px-3 py-0.5 rounded-pill">
              {greenhouse.area} m²
            </span>
          ) : null}
        </div>
        <GreenhouseActions id={greenhouse.id} />
      </div>

      {/* Weather */}
      <section className="bg-surface border border-border rounded-lg p-4 mb-4">
        <h2 className="font-heading text-sm font-semibold text-muted mb-3">Clima actual</h2>
        {weather ? (
          <WeatherWidget
            temperature={weather.current.temperature_2m}
            humidity={weather.current.relative_humidity_2m}
            wind={weather.current.wind_speed_10m}
          />
        ) : (
          <p className="text-sm text-subtle">Datos meteorológicos no disponibles.</p>
        )}
      </section>

      {/* 7-day forecast */}
      {weather?.daily ? (
        <section className="bg-surface border border-border rounded-lg p-4 mb-4">
          <h2 className="font-heading text-sm font-semibold text-muted mb-3">Próximos 7 días</h2>
          <div className="flex flex-col divide-y divide-border-subtle">
            {weather.daily.time.map((dateStr, i) => {
              const max   = weather!.daily!.temperature_2m_max[i]
              const min   = weather!.daily!.temperature_2m_min[i]
              const prob  = weather!.daily!.precipitation_probability_max[i]
              const wind  = weather!.daily!.wind_speed_10m_max[i]
              const code  = weather!.daily!.weathercode[i]
              const label = new Date(dateStr).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
              const icon  = wmoIcon(code)
              return (
                <div key={dateStr} className="flex items-center justify-between py-2 text-sm">
                  <span className="w-28 text-muted capitalize">{label}</span>
                  <span className="text-base">{icon}</span>
                  <span className="flex items-center gap-1 text-subtle text-xs w-16">
                    <Wind className="size-3 text-primary" />{wind.toFixed(0)} km/h
                  </span>
                  <span className="text-subtle text-xs w-12 text-right">{prob}% 💧</span>
                  <span className="text-foreground font-medium w-20 text-right">
                    {min.toFixed(0)}° / {max.toFixed(0)}°
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      ) : null}

      {/* Alerts */}
      {alerts.length > 0 ? (
        <section className="mb-4 flex flex-col gap-2">
          {alerts.map((a) => (
            <AlertBadge key={`${a.type}-${a.message}`} type={a.type} message={a.message} />
          ))}
        </section>
      ) : null}

      {/* Active crop */}
      {greenhouse.crops.length > 0 ? (
        <section className="bg-surface border border-border rounded-lg p-4 mb-4">
          <h2 className="font-heading text-sm font-semibold text-muted mb-2">Cultivo activo</h2>
          <div className="flex items-center gap-2">
            <Leaf className="size-4 text-primary" />
            <span className="text-sm text-foreground font-medium">{greenhouse.crops[0].name}</span>
            {greenhouse.crops[0].variety ? (
              <span className="text-xs text-subtle">— {greenhouse.crops[0].variety}</span>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* Notes */}
      {greenhouse.notes.length > 0 ? (
        <section className="bg-surface border border-border rounded-lg p-4">
          <h2 className="font-heading text-sm font-semibold text-muted mb-3 flex items-center gap-2">
            <FileText className="size-4" />
            Últimas notas
          </h2>
          <ul className="flex flex-col gap-3">
            {greenhouse.notes.map((note: Note) => (
              <li key={note.id} className="text-sm border-b border-border-subtle pb-3 last:border-0 last:pb-0">
                <p className="text-foreground">{note.content}</p>
                <p className="text-xs text-subtle mt-1">
                  {new Date(note.createdAt).toLocaleDateString('es-ES', {
                    day:   'numeric',
                    month: 'long',
                    year:  'numeric',
                  })}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}

export default GreenhouseDetailPage
