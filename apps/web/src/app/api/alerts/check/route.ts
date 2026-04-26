import { NextResponse } from 'next/server'
import { db } from '@brotia/db'
import { getWeather, checkAlerts } from '@/lib/weather'

export const POST = async (req: Request) => {
  const authHeader = req.headers.get('Authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  try {
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
  } catch {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
