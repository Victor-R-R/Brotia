import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { db } from '@brotia/db'
import type { Greenhouse, Crop } from '@brotia/db'
import { GreenhouseCard } from '@/components/greenhouse/greenhouse-card'
import { GreenhouseMapDynamic } from '@/components/greenhouse/greenhouse-map-dynamic'
import { getWeather } from '@/lib/weather'

const GreenhousesPage = async () => {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const greenhouses = await db.greenhouse.findMany({
    where:   { userId: session.user.id },
    include: {
      crops:  { where: { status: 'GROWING' }, take: 1 },
      alerts: { where: { read: false }, take: 3 },
    },
    orderBy: { createdAt: 'desc' },
  })

  const weatherResults = await Promise.allSettled(
    greenhouses.map(gh => getWeather(gh.lat, gh.lng))
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Mis Invernaderos</h1>
          <p className="text-sm text-muted mt-1">
            {greenhouses.length} {greenhouses.length === 1 ? 'invernadero' : 'invernaderos'}
          </p>
        </div>
        <Link
          href="/greenhouse/new"
          className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-hover transition-colors"
        >
          + Añadir invernadero
        </Link>
      </div>

      {greenhouses.length > 0 ? (
        <>
          <div className="h-72 mb-6 rounded-lg overflow-hidden">
            <GreenhouseMapDynamic
              markers={greenhouses.map((gh: Greenhouse) => ({
                id:   gh.id,
                name: gh.name,
                lat:  gh.lat,
                lng:  gh.lng,
              }))}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {greenhouses.map((gh: Greenhouse & { crops: Crop[] }, i) => {
              const w = weatherResults[i]
              const current = w.status === 'fulfilled' ? w.value.current : null
              return (
                <GreenhouseCard
                  key={gh.id}
                  id={gh.id}
                  name={gh.name}
                  lat={gh.lat}
                  lng={gh.lng}
                  area={gh.area}
                  activeCropName={gh.crops[0]?.name}
                  temperature={current?.temperature_2m}
                  humidity={current?.relative_humidity_2m}
                  wind={current?.wind_speed_10m}
                />
              )
            })}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-muted mb-4">Aún no tienes invernaderos registrados.</p>
          <Link
            href="/greenhouse/new"
            className="bg-primary text-white px-6 py-2.5 rounded-md text-sm font-medium hover:bg-primary-hover transition-colors"
          >
            Crear tu primer invernadero
          </Link>
        </div>
      )}
    </div>
  )
}

export default GreenhousesPage
