import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { $fetch } from '@nuxt/test-utils/e2e'
import {
  getTestDatabase,
  closeTestDatabase,
  cleanupTestData,
  createTestCampaign,
  assignUserToCampaign
} from '../../../helpers/db'
import {
  createAdminUser,
  createEditorUser,
  createNoRoleUser
} from '../../../helpers/auth'

describe('GET /api/admin/campaigns', async () => {
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

    // Create test campaigns
    campaign1 = await createTestCampaign(sql, { title: 'Test Campaign 1', status: 'active' })
    campaign2 = await createTestCampaign(sql, { title: 'Test Campaign 2', status: 'inactive' })

    // Assign editor to campaign1 only
    await assignUserToCampaign(sql, editorUserId, campaign1.id)
  })

  afterAll(async () => {
    await cleanupTestData(sql)
    await closeTestDatabase()
  })

  describe('Authorization', () => {
    it('returns 401 for unauthenticated requests', async () => {
      const error = await $fetch('/api/admin/campaigns').catch((e) => e)
      expect(error.statusCode).toBe(401)
    })

    it('returns 403 for users with no role', async () => {
      const error = await $fetch('/api/admin/campaigns', noRoleAuth).catch((e) => e)
      expect(error.statusCode).toBe(403)
    })

    it('succeeds for admin users', async () => {
      const response = await $fetch('/api/admin/campaigns', adminAuth)
      expect(response.campaigns).toBeDefined()
    })

    it('succeeds for campaign_editor users', async () => {
      const response = await $fetch('/api/admin/campaigns', editorAuth)
      expect(response.campaigns).toBeDefined()
    })
  })

  describe('Role-based filtering', () => {
    it('admin sees all campaigns', async () => {
      const response = await $fetch('/api/admin/campaigns', adminAuth)

      const slugs = response.campaigns.map((c: any) => c.slug)
      expect(slugs).toContain(campaign1.slug)
      expect(slugs).toContain(campaign2.slug)
    })

    it('campaign_editor sees only assigned campaigns', async () => {
      const response = await $fetch('/api/admin/campaigns', editorAuth)

      const slugs = response.campaigns.map((c: any) => c.slug)
      expect(slugs).toContain(campaign1.slug)
      expect(slugs).not.toContain(campaign2.slug)
    })
  })

  describe('Status filtering', () => {
    it('filters by active status', async () => {
      const response = await $fetch('/api/admin/campaigns?status=active', adminAuth)

      const statuses = response.campaigns.map((c: any) => c.status)
      expect(statuses.every((s: string) => s === 'active')).toBe(true)
    })

    it('filters by inactive status', async () => {
      const response = await $fetch('/api/admin/campaigns?status=inactive', adminAuth)

      const statuses = response.campaigns.map((c: any) => c.status)
      expect(statuses.every((s: string) => s === 'inactive')).toBe(true)
    })
  })

  describe('Response structure', () => {
    it('returns campaigns array with count', async () => {
      const response = await $fetch('/api/admin/campaigns', adminAuth)

      expect(response.campaigns).toBeDefined()
      expect(Array.isArray(response.campaigns)).toBe(true)
      expect(response.count).toBeDefined()
      expect(typeof response.count).toBe('number')
    })

    it('campaigns have expected fields', async () => {
      const response = await $fetch('/api/admin/campaigns', adminAuth)

      const campaign = response.campaigns.find((c: any) => c.id === campaign1.id)
      expect(campaign).toBeDefined()
      expect(campaign).toHaveProperty('id')
      expect(campaign).toHaveProperty('slug')
      expect(campaign).toHaveProperty('title')
      expect(campaign).toHaveProperty('status')
    })
  })
})
