import { ImageResponse } from 'next/og'
import { type NextRequest } from 'next/server'

export const GET = async (_req: NextRequest, { params }: { params: Promise<{ size: string }> }) => {
  const { size: sizeParam } = await params
  const size = sizeParam === '512' ? 512 : 192
  const radius = Math.round(size * 0.13)

  return new ImageResponse(
    <div
      style={{
        width: size,
        height: size,
        background: '#1A7A30',
        borderRadius: radius,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg
        width={size * 0.65}
        height={size * 0.75}
        viewBox="0 0 32 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M16 35 L16 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M16 28 Q6 23 6.5 14 L16 14 Z" fill="white" />
        <path d="M16 21 Q26 16 25.5 7 L16 7 Z" fill="white" />
      </svg>
    </div>,
    { width: size, height: size },
  )
}
