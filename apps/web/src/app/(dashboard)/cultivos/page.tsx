import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Leaf } from 'lucide-react'
import { auth } from '@/lib/auth'
import { db } from '@brotia/db'
import { CropActions } from '@/components/crop/crop-actions'

const statusConfig = {
  GROWING:   { label: 'En crecimiento', className: 'bg-primary/10 text-primary' },
  HARVESTED: { label: 'Cosechado',      className: 'bg-surface-alt text-muted'  },
  FAILED:    { label: 'Fallido',        className: 'bg-danger text-danger-text' },
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
          <Leaf className="size-10 text-muted mb-4" />
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
              <Link key={crop.id} href={`/cultivos/${crop.id}`} className="bg-surface border border-border rounded-lg p-4 block hover:border-primary/40 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Leaf className="size-4 text-primary shrink-0" />
                    <h3 className="font-heading text-base font-semibold text-foreground">{crop.name}</h3>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${st.className}`}>
                    {st.label}
                  </span>
                </div>

                {crop.variety ? (
                  <p className="text-xs text-subtle mb-2">Variedad: {crop.variety}</p>
                ) : null}

                <p className="text-xs text-subtle mb-1">
                  Invernadero: <span className="text-muted">{crop.greenhouse.name}</span>
                </p>
                <p className="text-xs text-subtle">
                  Plantado:{' '}
                  {new Date(crop.plantedAt).toLocaleDateString('es-ES', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </p>
                {crop.expectedHarvestAt ? (
                  <p className="text-xs text-subtle mt-1">
                    Cosecha prevista:{' '}
                    {new Date(crop.expectedHarvestAt).toLocaleDateString('es-ES', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </p>
                ) : null}

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
