import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      exclude: ['node_modules', '.next', 'src/__tests__', 'src/__mocks__'],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      'next/font/google': resolve(__dirname, './src/__mocks__/next-font.ts'),
    },
  },
})
