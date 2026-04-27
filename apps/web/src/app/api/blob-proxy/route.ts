import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export const GET = async (req: Request) => {
  const session = await auth()
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 })

  const { searchParams } = new URL(req.url)
  const blobUrl = searchParams.get('url')
  if (!blobUrl) return new NextResponse('Missing url', { status: 400 })

  if (!blobUrl.includes('vercel-storage.com')) {
    return new NextResponse('Invalid url', { status: 400 })
  }

  const res = await fetch(blobUrl, {
    headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
  })
  if (!res.ok) return new NextResponse('Blob fetch failed', { status: 502 })

  const contentType = res.headers.get('content-type') ?? 'image/jpeg'
  const buffer = await res.arrayBuffer()

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
