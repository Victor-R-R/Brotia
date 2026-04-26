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
    where:  { id, userId: session.user.id },
    select: { lat: true, lng: true },
  })

  if (!greenhouse) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const weather = await getWeather(greenhouse.lat, greenhouse.lng)
  const alerts  = checkAlerts(weather)

  return NextResponse.json({ weather, alerts })
}
