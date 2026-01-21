import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import {
  getTestDatabase,
  closeTestDatabase,
  cleanupTestData,
  createTestCampaign,
  assignUserToCampaign,
  getUserCampaignAccess
} from '../../../helpers/db'
import {
  createAdminUser,
  createEditorUser,
  createNoRoleUser
} from '../../../helpers/auth'

describe('User Campaign Access API', async () => {
  await setup({ server: true, browser: false })
  const sql = getTestDatabase()

  let adminAuth: { headers: { cookie: string } }
  let editorAuth: { headers: { cookie: string } }
  let targetUserId: string
  let campaign1: { id: number; slug: string }
  let campaign2: { id: number; slug: string }

  beforeAll(async () => {
    await cleanupTestData(sql)

    const admin = await createAdminUser(sql)
    adminAuth = admin.auth

    const editor = await createEditorUser(sql)
    editorAuth = editor.auth

    // Create a target user whose campaigns we'll manage
    const target = await createNoRoleUser(sql)
    targetUserId = target.user.id

    // Create test campaigns
    campaign1 = await createTestCampaign(sql, { title: 'Test Campaign 1' })
    campaign2 = await createTestCampaign(sql, { title: 'Test Campaign 2' })
  })

  afterAll(async () => {
    await cleanupTestData(sql)
    await closeTestDatabase()
  })

  describe('GET /api/admin/users/[id]/campaigns', () => {
    describe('Authorization', () => {
      it('returns 401 for unauthenticated requests', async () => {
        const error = await $fetch(`/api/admin/users/${targetUserId}/campaigns`).catch((e) => e)
        expect(error.statusCode).toBe(401)
      })

      it('returns 403 for non-admin users', async () => {
        const error = await $fetch(`/api/admin/users/${targetUserId}/campaigns`, editorAuth).catch((e) => e)
        expect(error.statusCode).toBe(403)
      })

      it('succeeds for admin users', async () => {
        const response = await $fetch(`/api/admin/users/${targetUserId}/campaigns`, adminAuth)
        expect(response.campaigns).toBeDefined()
      })
    })

    describe('Response structure', () => {
      it('returns all campaigns with hasAccess flag', async () => {
        // First assign user to campaign1
        await assignUserToCampaign(sql, targetUserId, campaign1.id)

        const response = await $fetch(`/api/admin/users/${targetUserId}/campaigns`, adminAuth)

        expect(response.success).toBe(true)
        expect(response.campaigns).toBeDefined()
        expect(Array.isArray(response.campaigns)).toBe(true)

        // Find our test campaigns
        const c1 = response.campaigns.find((c: any) => c.id === campaign1.id)
        const c2 = response.campaigns.find((c: any) => c.id === campaign2.id)

        expect(c1?.hasAccess).toBe(true)
        expect(c2?.hasAccess).toBe(false)
      })
    })

    describe('Validation', () => {
      it('returns 400 for invalid user ID', async () => {
        const error = await $fetch('/api/admin/users/invalid-id/campaigns', adminAuth).catch((e) => e)
        expect(error.statusCode).toBe(400)
      })
    })
  })

  describe('PUT /api/admin/users/[id]/campaigns', () => {
    describe('Authorization', () => {
      it('returns 401 for unauthenticated requests', async () => {
        const error = await $fetch(`/api/admin/users/${targetUserId}/campaigns`, {
          method: 'PUT',
          body: { campaign_ids: [campaign1.id] }
        }).catch((e) => e)

        expect(error.statusCode).toBe(401)
      })

      it('returns 403 for non-admin users', async () => {
        const error = await $fetch(`/api/admin/users/${targetUserId}/campaigns`, {
          method: 'PUT',
          body: { campaign_ids: [campaign1.id] },
          ...editorAuth
        }).catch((e) => e)

        expect(error.statusCode).toBe(403)
      })

      it('succeeds for admin users', async () => {
        const response = await $fetch(`/api/admin/users/${targetUserId}/campaigns`, {
          method: 'PUT',
          body: { campaign_ids: [campaign1.id] },
          ...adminAuth
        })

        expect(response.success).toBe(true)
      })
    })

    describe('Campaign assignment', () => {
      it('assigns user to multiple campaigns', async () => {
        const response = await $fetch(`/api/admin/users/${targetUserId}/campaigns`, {
          method: 'PUT',
          body: { campaign_ids: [campaign1.id, campaign2.id] },
          ...adminAuth
        })

        expect(response.success).toBe(true)

        const access = await getUserCampaignAccess(sql, targetUserId)
        expect(access).toContain(campaign1.id)
        expect(access).toContain(campaign2.id)
      })

      it('removes existing campaign access and replaces with new list', async () => {
        // First assign to both campaigns
        await $fetch(`/api/admin/users/${targetUserId}/campaigns`, {
          method: 'PUT',
          body: { campaign_ids: [campaign1.id, campaign2.id] },
          ...adminAuth
        })

        // Now assign to only campaign1
        const response = await $fetch(`/api/admin/users/${targetUserId}/campaigns`, {
          method: 'PUT',
          body: { campaign_ids: [campaign1.id] },
          ...adminAuth
        })

        expect(response.success).toBe(true)

        const access = await getUserCampaignAccess(sql, targetUserId)
        expect(access).toContain(campaign1.id)
        expect(access).not.toContain(campaign2.id)
      })

      it('can remove all campaign access', async () => {
        // First assign to a campaign
        await assignUserToCampaign(sql, targetUserId, campaign1.id)

        // Remove all access
        const response = await $fetch(`/api/admin/users/${targetUserId}/campaigns`, {
          method: 'PUT',
          body: { campaign_ids: [] },
          ...adminAuth
        })

        expect(response.success).toBe(true)

        const access = await getUserCampaignAccess(sql, targetUserId)
        expect(access).toHaveLength(0)
      })
    })

    describe('Validation', () => {
      it('returns 400 for invalid user ID', async () => {
        const error = await $fetch('/api/admin/users/invalid-id/campaigns', {
          method: 'PUT',
          body: { campaign_ids: [] },
          ...adminAuth
        }).catch((e) => e)

        expect(error.statusCode).toBe(400)
      })

      it('returns 400 for missing campaign_ids', async () => {
        const error = await $fetch(`/api/admin/users/${targetUserId}/campaigns`, {
          method: 'PUT',
          body: {},
          ...adminAuth
        }).catch((e) => e)

        expect(error.statusCode).toBe(400)
      })

      it('returns 400 for non-array campaign_ids', async () => {
        const error = await $fetch(`/api/admin/users/${targetUserId}/campaigns`, {
          method: 'PUT',
          body: { campaign_ids: 'not-an-array' },
          ...adminAuth
        }).catch((e) => e)

        expect(error.statusCode).toBe(400)
      })

      it('returns 404 for non-existent user', async () => {
        const fakeUuid = '00000000-0000-0000-0000-000000000000'
        const error = await $fetch(`/api/admin/users/${fakeUuid}/campaigns`, {
          method: 'PUT',
          body: { campaign_ids: [] },
          ...adminAuth
        }).catch((e) => e)

        expect(error.statusCode).toBe(404)
      })
    })
  })
})
