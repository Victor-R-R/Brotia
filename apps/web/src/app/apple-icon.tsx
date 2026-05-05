import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: 180,
        height: 180,
        background: '#1A7A30',
        borderRadius: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      <svg
        width="110"
        height="130"
        viewBox="0 0 32 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M16 35 L16 10" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M16 28 Q6 23 6.5 14 L16 14 Z" fill="white"/>
        <path d="M16 21 Q26 16 25.5 7 L16 7 Z" fill="white"/>
      </svg>
    </div>,
    { ...size },
  )
}
