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

describe('GET /api/admin/campaigns/[campaignId]/subscribers', async () => {
  await setup({ server: true, browser: false })
  const sql = getTestDatabase()

  let adminAuth: { headers: { cookie: string } }
  let editorAuth: { headers: { cookie: string } }
  let editorUserId: string
  let noRoleAuth: { headers: { cookie: string } }
  let assignedCampaign: { id: number; slug: string }
  let unassignedCampaign: { id: number; slug: string }

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
    assignedCampaign = await createTestCampaign(sql, { title: 'Assigned Campaign' })
    unassignedCampaign = await createTestCampaign(sql, { title: 'Unassigned Campaign' })

    // Assign editor to one campaign
    await assignUserToCampaign(sql, editorUserId, assignedCampaign.id)

    // Create some test subscribers with subscriptions
    for (let i = 0; i < 3; i++) {
      const subscriber = await createTestSubscriber(sql, { name: `Test Subscriber ${i}` })
      await createTestContactMethod(sql, subscriber.id, {
        value: `test-sub-${i}-${Date.now()}@example.com`,
        verified: true
      })
      await createTestCampaignSubscription(sql, assignedCampaign.id, subscriber.id, { status: 'active' })
    }
  })

  afterAll(async () => {
    await cleanupTestData(sql)
    await closeTestDatabase()
  })

  describe('Authorization', () => {
    it('returns 401 for unauthenticated requests', async () => {
      const error = await $fetch(`/api/admin/campaigns/${assignedCampaign.id}/subscribers`).catch((e) => e)
      expect(error.statusCode).toBe(401)
    })

    it('returns 403 for users with no role', async () => {
      const error = await $fetch(`/api/admin/campaigns/${assignedCampaign.id}/subscribers`, noRoleAuth).catch((e) => e)
      expect(error.statusCode).toBe(403)
    })
  })

  describe('Access control', () => {
    it('admin can view subscribers of any campaign', async () => {
      const response = await $fetch(`/api/admin/campaigns/${unassignedCampaign.id}/subscribers`, adminAuth)
      expect(response.subscribers).toBeDefined()
    })

    it('campaign_editor can view subscribers of assigned campaign', async () => {
      const response = await $fetch(`/api/admin/campaigns/${assignedCampaign.id}/subscribers`, editorAuth)
      expect(response.subscribers).toBeDefined()
    })

    it('campaign_editor cannot view subscribers of unassigned campaign', async () => {
      const error = await $fetch(`/api/admin/campaigns/${unassignedCampaign.id}/subscribers`, editorAuth).catch((e) => e)
      expect(error.statusCode).toBe(403)
    })
  })

  describe('Response structure', () => {
    it('returns subscribers array', async () => {
      const response = await $fetch(`/api/admin/campaigns/${assignedCampaign.id}/subscribers`, adminAuth)

      expect(response.subscribers).toBeDefined()
      expect(Array.isArray(response.subscribers)).toBe(true)
      expect(response.subscribers.length).toBeGreaterThan(0)
    })

    it('subscribers have expected fields', async () => {
      const response = await $fetch(`/api/admin/campaigns/${assignedCampaign.id}/subscribers`, adminAuth)

      const subscriber = response.subscribers[0]
      expect(subscriber).toHaveProperty('id')
      expect(subscriber).toHaveProperty('name')
    })
  })

  describe('Validation', () => {
    it('returns 400 for invalid campaign ID', async () => {
      const error = await $fetch('/api/admin/campaigns/invalid/subscribers', adminAuth).catch((e) => e)
      expect(error.statusCode).toBe(400)
    })
  })
})
