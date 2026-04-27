import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@brotia/db'
import { CompteForm } from '@/components/compte/compte-form'

const ComptePage = async () => {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await db.user.findUnique({
    where:  { id: session.user.id },
    select: {
      id:       true,
      email:    true,
      name:     true,
      lastName: true,
      phone:    true,
      address:  true,
      provider: true,
    },
  })

  if (!user) redirect('/login')

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">Mi cuenta</h1>
        <p className="text-sm text-muted mt-1">Gestiona tu perfil y preferencias</p>
      </div>
      <CompteForm user={user} />
    </div>
  )
}

export default ComptePage
