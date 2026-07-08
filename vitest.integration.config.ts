import { defineConfig } from 'vitest/config'
import { resolve } from 'path'
import { config } from 'dotenv'

config({ path: '.env.test' })

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/tests/integration/**/*.test.ts'],
    setupFiles: ['./src/tests/integration/setup.ts'],
    // Real Postgres access — run serially to avoid cross-test data races.
    fileParallelism: false,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
