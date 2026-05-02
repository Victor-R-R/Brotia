import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { db } from '@brotia/db'
import { CropActions } from '@/components/crop/crop-actions'
import { getCropEmoji } from '@/lib/crops'

const statusConfig = {
  GROWING:   { label: 'En crecimiento', emoji: '🌱', className: 'bg-primary/10 text-primary'      },
  HARVESTED: { label: 'Cosechado',      emoji: '🌾', className: 'bg-amber-50 text-amber-700'      },
  FAILED:    { label: 'Fallido',        emoji: '❌', className: 'bg-danger text-danger-text'       },
} as const

const CultivosPage = async () => {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const crops = await db.crop.findMany({
    where:   { greenhouse: { userId: session.user.id } },
    include: { greenhouse: { select: { id: true, name: true } } },
    orderBy: [{ status: 'asc' }, { plantedAt: 'desc' }],
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Mis Cultivos</h1>
          <p className="text-sm text-muted mt-1">
            {crops.length} {crops.length === 1 ? 'cultivo' : 'cultivos'}
          </p>
        </div>
        <Link
          href="/cultivos/new"
          className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-hover transition-colors"
        >
          + Añadir cultivo
        </Link>
      </div>

      {crops.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <span className="text-5xl mb-4">🌱</span>
          <p className="text-muted mb-4">Aún no tienes cultivos registrados.</p>
          <Link
            href="/cultivos/new"
            className="bg-primary text-white px-6 py-2.5 rounded-md text-sm font-medium hover:bg-primary-hover transition-colors"
          >
            Registrar primer cultivo
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {crops.map((crop: typeof crops[number]) => {
            const st = statusConfig[crop.status]
            return (
              <Link
                key={crop.id}
                href={`/cultivos/${crop.id}`}
                className="bg-surface border border-border rounded-xl p-4 block hover:shadow-md hover:border-primary/40 transition-all"
              >
                {/* Title + status */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-heading text-base font-semibold text-foreground flex items-center gap-2">
                    {getCropEmoji(crop.name)} {crop.name}
                  </h3>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap flex items-center gap-1 ${st.className}`}>
                    {st.emoji} {st.label}
                  </span>
                </div>

                {/* Variety */}
                {crop.variety ? (
                  <p className="text-xs text-subtle mb-2 flex items-center gap-1.5">
                    <span>🌿</span> {crop.variety}
                  </p>
                ) : null}

                {/* Greenhouse */}
                <p className="text-xs text-subtle mb-2 flex items-center gap-1.5">
                  <span>🏡</span>
                  <span className="text-muted">{crop.greenhouse.name}</span>
                </p>

                {/* Dates */}
                <div className="flex items-center gap-1.5 text-xs text-subtle pt-3 border-t border-border-subtle">
                  <span>📅</span>
                  <span>
                    {new Date(crop.plantedAt).toLocaleDateString('es-ES', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </span>
                  <span className="text-border">→</span>
                  {crop.harvestedAt ? (
                    <span className="text-muted">
                      {new Date(crop.harvestedAt).toLocaleDateString('es-ES', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </span>
                  ) : crop.expectedHarvestAt ? (
                    <span className="italic">
                      {new Date(crop.expectedHarvestAt).toLocaleDateString('es-ES', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })} (prevista)
                    </span>
                  ) : (
                    <span className="italic">sin fecha fin</span>
                  )}
                </div>

                <CropActions id={crop.id} />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default CultivosPage
