import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/get-auth-user'
import { db } from '@brotia/db'
import { getWeather, checkAlerts } from '@/lib/weather'

type Params = { params: Promise<{ id: string }> }

export const GET = async (req: Request, { params }: Params) => {
  const user = await getAuthUser(req)
  if (!user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const greenhouse = await db.greenhouse.findFirst({
      where:  { id, userId: user.id },
      select: { lat: true, lng: true },
    })

    if (!greenhouse) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }

    const weather = await getWeather(greenhouse.lat, greenhouse.lng)
    const alerts  = checkAlerts(weather)

    return NextResponse.json({ weather, alerts })
  } catch {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
