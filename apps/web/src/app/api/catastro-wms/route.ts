import { type NextRequest, NextResponse } from 'next/server'

const WMS_BASE = 'https://ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx'

export const GET = async (req: NextRequest) => {
  const url = new URL(WMS_BASE)
  req.nextUrl.searchParams.forEach((v, k) => url.searchParams.set(k, v))

  const res = await fetch(url.toString(), {
    headers: {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
      'Referer':    'https://www.catastro.meh.es/',
      'Accept':     'image/png,image/*,*/*;q=0.8',
    },
    next: { revalidate: 86400 }, // Next.js data cache — 24h server-side
  })

  if (!res.ok) {
    return new NextResponse(null, { status: res.status })
  }

  const body = await res.arrayBuffer()
  return new NextResponse(body, {
    headers: {
      'Content-Type':  res.headers.get('Content-Type') ?? 'image/png',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
