import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const POST = async (req: Request) => {
  const cookieStore = await cookies()
  cookieStore.delete('brotia_impersonate')
  return NextResponse.redirect(new URL('/admin/users', req.url))
}
