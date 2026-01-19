import postgres from 'postgres'
import { v4 as uuidv4 } from 'uuid'

let testDb: ReturnType<typeof postgres> | null = null

export function getTestDatabase() {
  if (testDb) return testDb

  const connectionString = process.env.TEST_DATABASE_URL

  if (!connectionString) {
    throw new Error(
      'TEST_DATABASE_URL environment variable is required for tests.\n' +
      'Create a test database branch and set TEST_DATABASE_URL in your .env file.\n' +
      'DO NOT run tests against your production database.'
    )
  }

  testDb = postgres(connectionString, {
    ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
    max: 5,
    idle_timeout: 10,
  })

  return testDb
}

export async function closeTestDatabase() {
  if (testDb) {
    await testDb.end()
    testDb = null
  }
}

export async function cleanupTestData(sql: ReturnType<typeof postgres>) {
  // Clean up test data created during tests
  // Delete in order respecting foreign key constraints
  await sql`DELETE FROM campaigns WHERE slug LIKE 'test-%'`
  await sql`DELETE FROM activity_logs WHERE metadata->>'email' LIKE 'test-%@example.com'`
  await sql`DELETE FROM subscribers WHERE name LIKE 'Test %'`
  await sql`DELETE FROM users WHERE email LIKE 'test-%@example.com'`
}

export async function createTestCampaign(
  sql: ReturnType<typeof postgres>,
  options: {
    title?: string
    slug?: string
    status?: 'active' | 'inactive'
    description?: string
    default_language?: string
  } = {}
) {
  const slugId = uuidv4().slice(0, 8)
  const title = options.title || `Test Campaign ${slugId}`
  const slug = options.slug || `test-${slugId}`
  const status = options.status ?? 'active'
  const description = options.description ?? ''
  const default_language = options.default_language ?? 'en'

  const result = await sql`
    INSERT INTO campaigns (slug, title, description, status, default_language)
    VALUES (${slug}, ${title}, ${description}, ${status}, ${default_language})
    RETURNING id, slug, title, status
  `

  return result[0]
}

export async function createTestSubscriber(
  sql: ReturnType<typeof postgres>,
  campaignId: string,
  options: {
    email?: string
    name?: string
    active?: boolean
    language?: string
  } = {}
) {
  const id = uuidv4()
  const email = options.email || `test-${id.slice(0, 8)}@example.com`
  const name = options.name || 'Test Subscriber'
  const active = options.active ?? true
  const language = options.language || 'en'
  const now = new Date().toISOString()

  await sql`
    INSERT INTO subscribers (id, campaign_id, email, name, active, language, created, updated)
    VALUES (${id}::uuid, ${campaignId}::uuid, ${email}, ${name}, ${active}, ${language}, ${now}, ${now})
  `

  return { id, email, name, active, language, campaignId }
}
