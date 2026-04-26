import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@brotia/db', '@brotia/api'],
}

export default nextConfig
