import path from 'path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@brotia/db', '@brotia/api'],
  turbopack: {
    // Monorepo root — prevents Turbopack from picking up a stray lockfile outside the project
    root: path.resolve(__dirname, '../..'),
  },
}

export default nextConfig
