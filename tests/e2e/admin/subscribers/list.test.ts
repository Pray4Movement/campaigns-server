import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import {
  getTestDatabase,
  closeTestDatabase,
  cleanupTestData,
  createTestCampaign,
  createTestSubscriber,
  createTestContactMethod,
  createTestCampaignSubscription,
  assignUserToCampaign
} from '../../../helpers/db'
import {
  createAdminUser,
  createEditorUser,
  createNoRoleUser
} from '../../../helpers/auth'

describe('GET /api/admin/subscribers', async () => {
  await setup({ server: true, browser: false })
  const sql = getTestDatabase()

  let adminAuth: { headers: { cookie: string } }
  let editorAuth: { headers: { cookie: string } }
  let editorUserId: string
  let noRoleAuth: { headers: { cookie: string } }
  let campaign1: { id: number; slug: string }
  let campaign2: { id: number; slug: string }

  beforeAll(async () => {
    await cleanupTestData(sql)

    const admin = await createAdminUser(sql)
    adminAuth = admin.auth

    const editor = await createEditorUser(sql)
    editorAuth = editor.auth
    editorUserId = editor.user.id

    const noRole = await createNoRoleUser(sql)
    noRoleAuth = noRole.auth

    // Create campaigns
    campaign1 = await createTestCampaign(sql, { title: 'Campaign 1' })
    campaign2 = await createTestCampaign(sql, { title: 'Campaign 2' })

    // Assign editor to campaign1 only
    await assignUserToCampaign(sql, editorUserId, campaign1.id)

    // Create subscribers in campaign1
    for (let i = 0; i < 2; i++) {
      const subscriber = await createTestSubscriber(sql, { name: `Test Sub C1 ${i}` })
      await createTestContactMethod(sql, subscriber.id, {
        value: `test-c1-${i}-${Date.now()}@example.com`,
        verified: true
      })
      await createTestCampaignSubscription(sql, campaign1.id, subscriber.id)
    }

    // Create subscribers in campaign2
    for (let i = 0; i < 2; i++) {
      const subscriber = await createTestSubscriber(sql, { name: `Test Sub C2 ${i}` })
      await createTestContactMethod(sql, subscriber.id, {
        value: `test-c2-${i}-${Date.now()}@example.com`,
        verified: true
      })
      await createTestCampaignSubscription(sql, campaign2.id, subscriber.id)
    }
  })

  afterAll(async () => {
    await cleanupTestData(sql)
    await closeTestDatabase()
  })

  describe('Authorization', () => {
    it('returns 401 for unauthenticated requests', async () => {
      const error = await $fetch('/api/admin/subscribers').catch((e) => e)
      expect(error.statusCode).toBe(401)
    })

    it('returns 403 for users with no role', async () => {
      const error = await $fetch('/api/admin/subscribers', noRoleAuth).catch((e) => e)
      expect(error.statusCode).toBe(403)
    })

    it('succeeds for admin users', async () => {
      const response = await $fetch('/api/admin/subscribers', adminAuth)
      expect(response.subscribers).toBeDefined()
    })

    it('succeeds for campaign_editor users', async () => {
      const response = await $fetch('/api/admin/subscribers', editorAuth)
      expect(response.subscribers).toBeDefined()
    })
  })

  describe('Campaign-based filtering', () => {
    it('admin sees all subscribers', async () => {
      const response = await $fetch('/api/admin/subscribers', adminAuth)

      // Should see subscribers from both campaigns
      const names = response.subscribers.map((s: any) => s.name)
      expect(names.some((n: string) => n.includes('C1'))).toBe(true)
      expect(names.some((n: string) => n.includes('C2'))).toBe(true)
    })

    it('campaign_editor sees only subscribers from assigned campaigns', async () => {
      const response = await $fetch('/api/admin/subscribers', editorAuth)

      // Should only see subscribers from campaign1
      const names = response.subscribers.map((s: any) => s.name)
      expect(names.some((n: string) => n.includes('C1'))).toBe(true)
      expect(names.every((n: string) => !n.includes('C2'))).toBe(true)
    })

    it('admin can filter by campaign_id', async () => {
      const response = await $fetch(`/api/admin/subscribers?campaign_id=${campaign1.id}`, adminAuth)

      const names = response.subscribers.map((s: any) => s.name)
      expect(names.every((n: string) => n.includes('C1'))).toBe(true)
    })

    it('campaign_editor cannot filter by unassigned campaign_id', async () => {
      const error = await $fetch(`/api/admin/subscribers?campaign_id=${campaign2.id}`, editorAuth).catch((e) => e)
      expect(error.statusCode).toBe(403)
    })
  })

  describe('Search', () => {
    it('supports search by name', async () => {
      const response = await $fetch('/api/admin/subscribers?search=Test%20Sub%20C1%200', adminAuth)

      expect(response.subscribers).toBeDefined()
      expect(response.subscribers.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Response structure', () => {
    it('returns subscribers array', async () => {
      const response = await $fetch('/api/admin/subscribers', adminAuth)

      expect(response.subscribers).toBeDefined()
      expect(Array.isArray(response.subscribers)).toBe(true)
    })
  })
})
