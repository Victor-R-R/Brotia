import { NextResponse } from 'next/server'
import type { Feature } from 'geojson'

const tag = (xml: string, name: string): string | null => {
  const m = xml.match(new RegExp(`<${name}>([^<]*)<\/${name}>`))
  return m ? m[1].trim() : null
}

export const GET = async (req: Request) => {
  const { searchParams } = new URL(req.url)
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')

  if (!lat || !lng) {
    return NextResponse.json({ error: 'lat and lng required' }, { status: 400 })
  }

  try {
    // 1. Resolve parcel reference (RC) from coordinates
    const rcRes = await fetch(
      `https://ovc.catastro.meh.es/OVCServWeb/OVCWCServidor/ServidorOVC.asmx/Consulta_RCCOOR` +
      `?SRS=EPSG:4326&Coordenada_X=${lng}&Coordenada_Y=${lat}`,
      { headers: { Accept: 'text/xml' } }
    )
    if (!rcRes.ok) return NextResponse.json({ found: false })

    const rcXml = await rcRes.text()
    const pc1   = tag(rcXml, 'pc1')
    const pc2   = tag(rcXml, 'pc2')

    if (!pc1 || !pc2) return NextResponse.json({ found: false })

    const rc      = `${pc1}${pc2}` // 14-char cadastral reference
    const address = tag(rcXml, 'ldt') ?? ''

    // 2. Fetch parcel polygon from INSPIRE WFS (GeoJSON)
    let polygon: Feature | null = null
    let area:    number | null  = null

    try {
      const wfsRes = await fetch(
        `https://ovc.catastro.meh.es/INSPIRE/wfs/CadastralParcel` +
        `?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature` +
        `&TypeNames=CP:CadastralParcel&FEATUREID=ES.SDGC.CP.${rc}` +
        `&outputFormat=application/json`,
        { headers: { Accept: 'application/json' } }
      )
      if (wfsRes.ok) {
        const gj = await wfsRes.json()
        if (Array.isArray(gj?.features) && gj.features.length > 0) {
          polygon = gj.features[0] as Feature
          const props = polygon?.properties as Record<string, unknown> | null
          const raw   = props?.['cp:areaValue'] ?? props?.['areaValue']
          if (typeof raw === 'number')       area = raw
          else if (typeof raw === 'string')  area = parseFloat(raw) || null
        }
      }
    } catch {
      // WFS optional — not critical
    }

    return NextResponse.json({ found: true, rc, address, area, polygon })
  } catch {
    return NextResponse.json({ error: 'catastro_unavailable' }, { status: 502 })
  }
}
