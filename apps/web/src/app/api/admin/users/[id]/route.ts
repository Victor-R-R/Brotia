import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/get-auth-user'
import { db } from '@brotia/db'
import { z } from 'zod'

const requireSuperadmin = async (req: Request) => {
  const authUser = await getAuthUser(req)
  if (!authUser?.id) return null
  const dbUser = await db.user.findUnique({ where: { id: authUser.id }, select: { id: true, role: true } })
  if (dbUser?.role !== 'SUPERADMIN') return null
  return dbUser
}

export const DELETE = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const admin = await requireSuperadmin(req)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params

  if (id === admin.id) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
  }

  try {
    await db.user.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}

const patchSchema = z.object({
  role: z.enum(['USER', 'SUPERADMIN']),
})

export const PATCH = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const admin = await requireSuperadmin(req)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params

  if (id === admin.id) {
    return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 })
  }

  const body = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  try {
    const user = await db.user.update({
      where: { id },
      data:  { role: parsed.data.role },
      select: { id: true, email: true, role: true },
    })
    return NextResponse.json(user)
  } catch {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}
