import { defineVitestConfig } from '@nuxt/test-utils/config'
import { loadEnv } from 'vite'

// Load .env file
const env = loadEnv('test', process.cwd(), '')

// Use TEST_DATABASE_URL for both the server and test helpers
if (env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = env.TEST_DATABASE_URL
  process.env.TEST_DATABASE_URL = env.TEST_DATABASE_URL
}

export default defineVitestConfig({
  // Externalize bun:test to avoid bundling issues when running under node
  resolve: {
    alias: {
      'bun:test': 'vitest',
    },
  },
  test: {
    environment: 'nuxt',
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/unit/**'],
    testTimeout: 60000,
    fileParallelism: false,
    sequence: {
      hooks: 'list',
    },
  },
})
