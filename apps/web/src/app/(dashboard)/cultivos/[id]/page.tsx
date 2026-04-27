import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Leaf, Pencil } from 'lucide-react'
import { auth } from '@/lib/auth'
import { db } from '@brotia/db'
import { AddHarvestForm } from '@/components/crop/add-harvest-form'
import { AddPestForm } from '@/components/crop/add-pest-form'
import { HarvestList } from '@/components/crop/harvest-list'
import { PestList } from '@/components/crop/pest-list'

type Props = { params: Promise<{ id: string }> }

const severityLabel: Record<string, string> = {
  low:    'Leve',
  medium: 'Moderada',
  high:   'Grave',
}

const statusConfig = {
  GROWING:   { label: 'En crecimiento', className: 'bg-primary/10 text-primary' },
  HARVESTED: { label: 'Cosechado',      className: 'bg-surface-alt text-muted'  },
  FAILED:    { label: 'Fallido',        className: 'bg-danger text-danger-text' },
} as const

export { severityLabel, statusConfig }

const CropDetailPage = async ({ params }: Props) => {
  const { id } = await params

  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const crop = await db.crop.findFirst({
    where:   { id, greenhouse: { userId: session.user.id } },
    include: {
      greenhouse:     { select: { id: true, name: true } },
      harvestRecords: { orderBy: { harvestedAt: 'desc' } },
      pestRecords:    { orderBy: { detectedAt: 'desc' } },
    },
  })

  if (!crop) notFound()

  const totalKg = crop.harvestRecords.reduce((sum, h) => sum + h.kg, 0)
  const st      = statusConfig[crop.status]

  return (
    <div className="max-w-2xl">
      <Link
        href="/cultivos"
        className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="size-4" />
        Mis cultivos
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Leaf className="size-5 text-primary" />
            <h1 className="font-heading text-2xl font-bold text-foreground">{crop.name}</h1>
            {crop.variety ? <span className="text-sm text-subtle">— {crop.variety}</span> : null}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.className}`}>
              {st.label}
            </span>
            <span className="text-xs text-subtle">
              {crop.greenhouse.name}
            </span>
            <span className="text-xs text-subtle">
              Plantado {new Date(crop.plantedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>
        <Link
          href={`/cultivos/${id}/edit`}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-border text-muted hover:text-foreground hover:border-primary/50 transition-colors"
        >
          <Pencil className="size-3" />
          Editar
        </Link>
      </div>

      {/* Recogidas */}
      <section className="bg-surface border border-border rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading text-sm font-semibold text-muted">Recogidas</h2>
          {totalKg > 0 ? (
            <span className="text-sm font-semibold text-foreground">
              Total: {totalKg.toFixed(1)} kg
            </span>
          ) : null}
        </div>

        <HarvestList cropId={id} records={crop.harvestRecords} />
        <div className="mt-4 pt-4 border-t border-border-subtle">
          <AddHarvestForm cropId={id} />
        </div>
      </section>

      {/* Plagas */}
      <section className="bg-surface border border-border rounded-lg p-4">
        <h2 className="font-heading text-sm font-semibold text-muted mb-3">Plagas detectadas</h2>
        <PestList cropId={id} records={crop.pestRecords} />
        <div className="mt-4 pt-4 border-t border-border-subtle">
          <AddPestForm cropId={id} />
        </div>
      </section>
    </div>
  )
}

export default CropDetailPage
