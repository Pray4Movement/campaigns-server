import { execSync } from 'node:child_process'
import { createTest, exposeContextToEnv } from '@nuxt/test-utils/e2e'

const hooks = createTest({ server: true, browser: false })

export async function setup() {
  execSync('bun run migrate', {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
    },
  })
  await hooks.beforeAll()
  exposeContextToEnv()
}

export async function teardown() {
  await hooks.afterAll()
}
