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
  await sql`DELETE FROM campaign_subscriptions WHERE campaign_id IN (SELECT id FROM campaigns WHERE slug LIKE 'test-%')`
  await sql`DELETE FROM contact_methods WHERE subscriber_id IN (SELECT id FROM subscribers WHERE name LIKE 'Test %')`
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
  options: {
    name?: string
  } = {}
) {
  const tracking_id = uuidv4()
  const profile_id = uuidv4()
  const name = options.name || 'Test Subscriber'

  const result = await sql`
    INSERT INTO subscribers (tracking_id, profile_id, name)
    VALUES (${tracking_id}, ${profile_id}, ${name})
    RETURNING id, tracking_id, profile_id, name
  `

  return result[0] as { id: number; tracking_id: string; profile_id: string; name: string }
}

export async function createTestContactMethod(
  sql: ReturnType<typeof postgres>,
  subscriberId: number,
  options: {
    type?: 'email' | 'phone'
    value?: string
    verified?: boolean
  } = {}
) {
  const type = options.type || 'email'
  const value = options.value || `test-${uuidv4().slice(0, 8)}@example.com`
  const verified = options.verified ?? false

  const result = await sql`
    INSERT INTO contact_methods (subscriber_id, type, value, verified)
    VALUES (${subscriberId}, ${type}, ${value}, ${verified})
    RETURNING id, subscriber_id, type, value, verified, verification_token, verification_token_expires_at
  `

  return result[0] as {
    id: number
    subscriber_id: number
    type: string
    value: string
    verified: boolean
    verification_token: string | null
    verification_token_expires_at: string | null
  }
}

export async function createTestCampaignSubscription(
  sql: ReturnType<typeof postgres>,
  campaignId: number,
  subscriberId: number,
  options: {
    delivery_method?: 'email' | 'whatsapp' | 'app'
    frequency?: string
    time_preference?: string
    timezone?: string
    status?: 'active' | 'inactive' | 'unsubscribed'
    days_of_week?: number[]
  } = {}
) {
  const delivery_method = options.delivery_method || 'email'
  const frequency = options.frequency || 'daily'
  const time_preference = options.time_preference || '09:00'
  const timezone = options.timezone || 'UTC'
  const status = options.status || 'active'
  const days_of_week = options.days_of_week ? JSON.stringify(options.days_of_week) : null

  const result = await sql`
    INSERT INTO campaign_subscriptions (
      campaign_id, subscriber_id, delivery_method, frequency,
      time_preference, timezone, status, days_of_week
    )
    VALUES (
      ${campaignId}, ${subscriberId}, ${delivery_method}, ${frequency},
      ${time_preference}, ${timezone}, ${status}, ${days_of_week}
    )
    RETURNING id, campaign_id, subscriber_id, delivery_method, frequency,
              time_preference, timezone, status, days_of_week, next_reminder_utc
  `

  return result[0] as {
    id: number
    campaign_id: number
    subscriber_id: number
    delivery_method: string
    frequency: string
    time_preference: string
    timezone: string
    status: string
    days_of_week: string | null
    next_reminder_utc: string | null
  }
}

export async function getTestContactMethod(
  sql: ReturnType<typeof postgres>,
  subscriberId: number,
  type: 'email' | 'phone' = 'email'
) {
  const result = await sql`
    SELECT * FROM contact_methods
    WHERE subscriber_id = ${subscriberId} AND type = ${type}
  `
  return result[0] as {
    id: number
    subscriber_id: number
    type: string
    value: string
    verified: boolean
    verification_token: string | null
    verification_token_expires_at: string | null
    consent_doxa_general: boolean
    consented_campaign_ids: number[]
  } | undefined
}

export async function getTestSubscription(
  sql: ReturnType<typeof postgres>,
  campaignId: number,
  subscriberId: number
) {
  const result = await sql`
    SELECT * FROM campaign_subscriptions
    WHERE campaign_id = ${campaignId} AND subscriber_id = ${subscriberId}
    ORDER BY created_at DESC
    LIMIT 1
  `
  return result[0] as {
    id: number
    campaign_id: number
    subscriber_id: number
    delivery_method: string
    frequency: string
    time_preference: string
    timezone: string
    status: string
    days_of_week: string | null
    next_reminder_utc: string | null
  } | undefined
}

export async function getAllTestSubscriptions(
  sql: ReturnType<typeof postgres>,
  campaignId: number,
  subscriberId: number
) {
  const result = await sql`
    SELECT * FROM campaign_subscriptions
    WHERE campaign_id = ${campaignId} AND subscriber_id = ${subscriberId}
    ORDER BY created_at ASC
  `
  return result as Array<{
    id: number
    campaign_id: number
    subscriber_id: number
    delivery_method: string
    frequency: string
    time_preference: string
    timezone: string
    status: string
    days_of_week: string | null
    next_reminder_utc: string | null
  }>
}

export async function setVerificationToken(
  sql: ReturnType<typeof postgres>,
  contactMethodId: number,
  token: string,
  expiresAt: Date
) {
  await sql`
    UPDATE contact_methods
    SET verification_token = ${token},
        verification_token_expires_at = ${expiresAt.toISOString()}
    WHERE id = ${contactMethodId}
  `
}

export async function getTestSubscriberByEmail(
  sql: ReturnType<typeof postgres>,
  email: string
) {
  const result = await sql`
    SELECT s.* FROM subscribers s
    JOIN contact_methods cm ON cm.subscriber_id = s.id
    WHERE cm.type = 'email' AND LOWER(cm.value) = LOWER(${email})
  `
  return result[0] as { id: number; tracking_id: string; profile_id: string; name: string } | undefined
}
