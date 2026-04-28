import { type NextRequest, NextResponse } from 'next/server'
import { deflateSync } from 'zlib'

const WMS_BASE = 'https://ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx'

// Build a valid 256×256 RGBA-transparent PNG at module load time (no external deps).
// Returned when catastro rate-limits so MapLibre renders a blank tile instead of
// throwing InvalidStateError / AJAXError in the console.
const TRANSPARENT_TILE = (() => {
  const crc32 = (buf: Buffer): number => {
    let c = 0xffffffff
    for (const b of buf) {
      c ^= b
      for (let i = 0; i < 8; i++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
    }
    return (c ^ 0xffffffff) >>> 0
  }
  const chunk = (type: string, data: Buffer): Buffer => {
    const t = Buffer.from(type, 'ascii')
    const len = Buffer.allocUnsafe(4)
    len.writeUInt32BE(data.length, 0)
    const crc = Buffer.allocUnsafe(4)
    crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0)
    return Buffer.concat([len, t, data, crc])
  }
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.allocUnsafe(13)
  ihdr.writeUInt32BE(256, 0)
  ihdr.writeUInt32BE(256, 4)
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0
  const raw = Buffer.alloc(256 * (1 + 256 * 4))
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))])
})()

// ─── In-memory tile cache ─────────────────────────────────────────────────────
// Stores successfully fetched tiles so the throttle is bypassed on repeat
// requests (e.g. pan back to a previously-viewed area). Bounded at 2 000 tiles
// (~20–100 MB) — cleared wholesale when the limit is hit.
type Entry = { buf: Buffer; ct: string }
const _cache = new Map<string, Entry>()

// ─── Request throttle ─────────────────────────────────────────────────────────
// catastro.meh.es's BigIP WAF blocks server IPs that burst tile requests.
// We serialise outgoing fetches so at most one catastro request is in-flight
// at a time, with a 200 ms gap between them (~5 req/s max).
// - In development (single Turbopack process) this prevents the burst.
// - In production most tiles come from Next.js Data Cache (revalidate: 86 400s)
//   so the throttle is rarely reached.
let _throttleChain = Promise.resolve()

const withThrottle = <T>(fn: () => Promise<T>): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    _throttleChain = _throttleChain.then(async () => {
      try { resolve(await fn()) } catch (e) { reject(e) }
      await new Promise(r => setTimeout(r, 200))
    })
  })

// ─────────────────────────────────────────────────────────────────────────────

export const GET = async (req: NextRequest): Promise<NextResponse> => {
  const url = new URL(WMS_BASE)
  req.nextUrl.searchParams.forEach((v, k) => url.searchParams.set(k, v))
  const tileUrl = url.toString()

  // Fast path: serve from in-memory cache without throttling
  const hit = _cache.get(tileUrl)
  if (hit) {
    return new NextResponse(hit.buf, {
      headers: { 'Content-Type': hit.ct, 'Cache-Control': 'public, max-age=86400' },
    })
  }

  return withThrottle(async () => {
    // Re-check cache after waiting in the throttle queue (another request may
    // have fetched this tile while we were waiting)
    const hitAfterWait = _cache.get(tileUrl)
    if (hitAfterWait) {
      return new NextResponse(hitAfterWait.buf, {
        headers: { 'Content-Type': hitAfterWait.ct, 'Cache-Control': 'public, max-age=86400' },
      })
    }

    const res = await fetch(tileUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
        'Referer':    'https://www.catastro.meh.es/',
        'Accept':     'image/png,image/*,*/*;q=0.8',
      },
      next: { revalidate: 86400 },
    })

    const ct = res.headers.get('Content-Type') ?? ''
    if (!res.ok || !ct.startsWith('image/')) {
      return new NextResponse(TRANSPARENT_TILE, {
        headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=300' },
      })
    }

    const body  = await res.arrayBuffer()
    const entry = { buf: Buffer.from(body), ct }

    if (_cache.size >= 2000) _cache.clear()
    _cache.set(tileUrl, entry)

    return new NextResponse(body, {
      headers: { 'Content-Type': ct, 'Cache-Control': 'public, max-age=86400' },
    })
  })
}
