import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { $fetch } from '@nuxt/test-utils/e2e'
import {
  getTestDatabase,
  closeTestDatabase,
  cleanupTestData,
  getUserCampaignAccess
} from '../../../helpers/db'
import {
  createAdminUser,
  createEditorUser,
  createNoRoleUser
} from '../../../helpers/auth'

describe('POST /api/admin/campaigns', async () => {
  const sql = getTestDatabase()

  let adminAuth: { headers: { cookie: string } }
  let adminUserId: string
  let editorAuth: { headers: { cookie: string } }
  let editorUserId: string
  let noRoleAuth: { headers: { cookie: string } }

  beforeAll(async () => {
    await cleanupTestData(sql)

    const admin = await createAdminUser(sql)
    adminAuth = admin.auth
    adminUserId = admin.user.id

    const editor = await createEditorUser(sql)
    editorAuth = editor.auth
    editorUserId = editor.user.id

    const noRole = await createNoRoleUser(sql)
    noRoleAuth = noRole.auth
  })

  afterEach(async () => {
    // Clean up created campaigns
    await sql`DELETE FROM campaign_users WHERE campaign_id IN (SELECT id FROM campaigns WHERE slug LIKE 'test-%')`
    await sql`DELETE FROM campaigns WHERE slug LIKE 'test-%'`
  })

  afterAll(async () => {
    await cleanupTestData(sql)
    await closeTestDatabase()
  })

  describe('Authorization', () => {
    it('returns 401 for unauthenticated requests', async () => {
      const error = await $fetch('/api/admin/campaigns', {
        method: 'POST',
        body: { title: 'Test Campaign' }
      }).catch((e) => e)

      expect(error.statusCode).toBe(401)
    })

    it('returns 403 for users with no role', async () => {
      const error = await $fetch('/api/admin/campaigns', {
        method: 'POST',
        body: { title: 'Test Campaign' },
        ...noRoleAuth
      }).catch((e) => e)

      expect(error.statusCode).toBe(403)
    })

    it('succeeds for admin users', async () => {
      const response = await $fetch('/api/admin/campaigns', {
        method: 'POST',
        body: { title: 'Test Admin Campaign', slug: `test-admin-${Date.now()}` },
        ...adminAuth
      })

      expect(response.success).toBe(true)
      expect(response.campaign).toBeDefined()
    })

    it('succeeds for campaign_editor users', async () => {
      const response = await $fetch('/api/admin/campaigns', {
        method: 'POST',
        body: { title: 'Test Editor Campaign', slug: `test-editor-${Date.now()}` },
        ...editorAuth
      })

      expect(response.success).toBe(true)
      expect(response.campaign).toBeDefined()
    })
  })

  describe('Auto-assignment', () => {
    it('admin is NOT auto-assigned to created campaign (admins have global access)', async () => {
      const response = await $fetch('/api/admin/campaigns', {
        method: 'POST',
        body: { title: 'Test Admin Auto', slug: `test-admin-auto-${Date.now()}` },
        ...adminAuth
      })

      expect(response.success).toBe(true)

      // Admins should NOT be in campaign_users (they have global access)
      const access = await getUserCampaignAccess(sql, adminUserId)
      expect(access).not.toContain(response.campaign.id)
    })

    it('campaign_editor IS auto-assigned to created campaign', async () => {
      const response = await $fetch('/api/admin/campaigns', {
        method: 'POST',
        body: { title: 'Test Editor Auto', slug: `test-editor-auto-${Date.now()}` },
        ...editorAuth
      })

      expect(response.success).toBe(true)

      // Editor should be auto-assigned
      const access = await getUserCampaignAccess(sql, editorUserId)
      expect(access).toContain(response.campaign.id)
    })
  })

  describe('Validation', () => {
    it('returns 400 for missing title', async () => {
      const error = await $fetch('/api/admin/campaigns', {
        method: 'POST',
        body: {},
        ...adminAuth
      }).catch((e) => e)

      expect(error.statusCode).toBe(400)
      expect(error.statusMessage).toContain('Title is required')
    })

    it('returns 400 for duplicate slug', async () => {
      const slug = `test-duplicate-${Date.now()}`

      // Create first campaign
      await $fetch('/api/admin/campaigns', {
        method: 'POST',
        body: { title: 'First Campaign', slug },
        ...adminAuth
      })

      // Try to create second campaign with same slug
      const error = await $fetch('/api/admin/campaigns', {
        method: 'POST',
        body: { title: 'Second Campaign', slug },
        ...adminAuth
      }).catch((e) => e)

      expect(error.statusCode).toBe(400)
      expect(error.statusMessage.toLowerCase()).toContain('slug')
    })
  })

  describe('Campaign creation', () => {
    it('creates campaign with default status active', async () => {
      const response = await $fetch('/api/admin/campaigns', {
        method: 'POST',
        body: { title: 'Test Default Status', slug: `test-default-${Date.now()}` },
        ...adminAuth
      })

      expect(response.campaign.status).toBe('active')
    })

    it('creates campaign with specified status', async () => {
      const response = await $fetch('/api/admin/campaigns', {
        method: 'POST',
        body: {
          title: 'Test Inactive',
          slug: `test-inactive-${Date.now()}`,
          status: 'inactive'
        },
        ...adminAuth
      })

      expect(response.campaign.status).toBe('inactive')
    })

    it('auto-generates slug if not provided', async () => {
      const response = await $fetch('/api/admin/campaigns', {
        method: 'POST',
        body: { title: 'Test Auto Slug Generation' },
        ...adminAuth
      })

      expect(response.success).toBe(true)
      expect(response.campaign.slug).toBeDefined()
      expect(response.campaign.slug).toContain('test-auto-slug')
    })

    it('saves description', async () => {
      const description = 'This is a test description'
      const response = await $fetch('/api/admin/campaigns', {
        method: 'POST',
        body: {
          title: 'Test With Description',
          slug: `test-desc-${Date.now()}`,
          description
        },
        ...adminAuth
      })

      expect(response.campaign.description).toBe(description)
    })
  })
})
