import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@brotia/db'
import { EstadisticasDashboard } from '@/components/estadisticas/estadisticas-dashboard'
import type { HarvestEntry, PestEntry, AlertEntry, CropEntry, Greenhouse } from '@/components/estadisticas/estadisticas-dashboard'

const EstadisticasPage = async () => {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const userId = session.user.id

  const [greenhouses, harvestRecords, pestRecords, weatherAlerts, crops] = await Promise.all([
    db.greenhouse.findMany({
      where: { userId },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    db.harvestRecord.findMany({
      where: { crop: { greenhouse: { userId } } },
      include: {
        crop: {
          select: {
            name: true,
            greenhouse: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { harvestedAt: 'asc' },
    }),
    db.pestRecord.findMany({
      where: { crop: { greenhouse: { userId } } },
      select: {
        pestName: true,
        severity: true,
        detectedAt: true,
        crop: { select: { greenhouse: { select: { id: true } } } },
      },
      orderBy: { detectedAt: 'asc' },
    }),
    db.weatherAlert.findMany({
      where: { greenhouse: { userId } },
      select: { type: true, severity: true, triggeredAt: true, greenhouseId: true },
      orderBy: { triggeredAt: 'asc' },
    }),
    db.crop.findMany({
      where: { greenhouse: { userId } },
      select: { status: true, greenhouseId: true },
    }),
  ])

  const harvestEntries: HarvestEntry[] = harvestRecords.map(r => ({
    cropName: r.crop.name,
    greenhouseId: r.crop.greenhouse.id,
    greenhouseName: r.crop.greenhouse.name,
    kg: r.kg,
    harvestedAt: r.harvestedAt.toISOString(),
  }))

  const pestEntries: PestEntry[] = pestRecords.map(r => ({
    pestName: r.pestName,
    severity: r.severity,
    detectedAt: r.detectedAt.toISOString(),
    greenhouseId: r.crop.greenhouse.id,
  }))

  const pestCount = pestRecords.length

  const alertEntries: AlertEntry[] = weatherAlerts.map(r => ({
    type: r.type,
    severity: r.severity,
    triggeredAt: r.triggeredAt.toISOString(),
    greenhouseId: r.greenhouseId,
  }))

  const cropEntries: CropEntry[] = crops.map(c => ({
    status: c.status,
    greenhouseId: c.greenhouseId,
  }))

  const ghList: Greenhouse[] = greenhouses

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">Estadísticas</h1>
        <p className="text-sm text-muted mt-1">Rendimiento y producción de tus cultivos</p>
      </div>

      <EstadisticasDashboard
        greenhouses={ghList}
        harvestEntries={harvestEntries}
        pestEntries={pestEntries}
        alertEntries={alertEntries}
        cropEntries={cropEntries}
        pestCount={pestCount}
      />
    </div>
  )
}

export default EstadisticasPage
