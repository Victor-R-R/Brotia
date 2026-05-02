import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@brotia/db'

export type EstadisticasData = {
  greenhouseCount:    number
  cropCounts:         { GROWING: number; HARVESTED: number; FAILED: number }
  harvestTotalKg:     number
  harvestLast30DaysKg: number
  alertCounts:        Record<string, number>
  pestCount:          number
  recentHarvests: {
    cropName:       string
    greenhouseName: string
    kg:             number
    harvestedAt:    string
  }[]
}

export const GET = async (_req: Request) => {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  try {
    const [greenhouses, crops, harvests, alerts, pests] = await Promise.all([
      db.greenhouse.count({ where: { userId } }),
      db.crop.findMany({
        where:  { greenhouse: { userId } },
        select: { status: true },
      }),
      db.harvestRecord.findMany({
        where:   { crop: { greenhouse: { userId } } },
        select:  {
          kg:          true,
          harvestedAt: true,
          crop: { select: { name: true, greenhouse: { select: { name: true } } } },
        },
        orderBy: { harvestedAt: 'desc' },
      }),
      db.weatherAlert.findMany({
        where:  { greenhouse: { userId } },
        select: { type: true },
      }),
      db.pestRecord.count({ where: { crop: { greenhouse: { userId } } } }),
    ])

    const cropCounts = { GROWING: 0, HARVESTED: 0, FAILED: 0 }
    for (const c of crops) cropCounts[c.status] = (cropCounts[c.status] ?? 0) + 1

    const harvestTotalKg = harvests.reduce((sum, h) => sum + h.kg, 0)

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const harvestLast30DaysKg = harvests
      .filter(h => h.harvestedAt >= thirtyDaysAgo)
      .reduce((sum, h) => sum + h.kg, 0)

    const alertCounts: Record<string, number> = {}
    for (const a of alerts) {
      alertCounts[a.type] = (alertCounts[a.type] ?? 0) + 1
    }

    const recentHarvests = harvests.slice(0, 10).map(h => ({
      cropName:       h.crop.name,
      greenhouseName: h.crop.greenhouse.name,
      kg:             h.kg,
      harvestedAt:    h.harvestedAt.toISOString(),
    }))

    const data: EstadisticasData = {
      greenhouseCount: greenhouses,
      cropCounts,
      harvestTotalKg,
      harvestLast30DaysKg,
      alertCounts,
      pestCount: pests,
      recentHarvests,
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
