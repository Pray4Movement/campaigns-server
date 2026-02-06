import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
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

describe('Campaign CRUD API', async () => {
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
  })

  beforeEach(async () => {
    // Create fresh campaigns for each test
    assignedCampaign = await createTestCampaign(sql, { title: 'Assigned Campaign' })
    unassignedCampaign = await createTestCampaign(sql, { title: 'Unassigned Campaign' })

    // Assign editor to one campaign
    await assignUserToCampaign(sql, editorUserId, assignedCampaign.id)
  })

  afterAll(async () => {
    await cleanupTestData(sql)
    await closeTestDatabase()
  })

  describe('GET /api/admin/campaigns/[campaignId]', () => {
    describe('Authorization', () => {
      it('returns 401 for unauthenticated requests', async () => {
        const error = await $fetch(`/api/admin/campaigns/${assignedCampaign.id}`).catch((e) => e)
        expect(error.statusCode).toBe(401)
      })

      it('returns 403 for users with no role/permission', async () => {
        const error = await $fetch(`/api/admin/campaigns/${assignedCampaign.id}`, noRoleAuth).catch((e) => e)
        expect(error.statusCode).toBe(403)
      })
    })

    describe('Access control', () => {
      it('admin can access any campaign', async () => {
        const response = await $fetch(`/api/admin/campaigns/${unassignedCampaign.id}`, adminAuth)
        expect(response.campaign).toBeDefined()
        expect(response.campaign.id).toBe(unassignedCampaign.id)
      })

      it('campaign_editor can access assigned campaign', async () => {
        const response = await $fetch(`/api/admin/campaigns/${assignedCampaign.id}`, editorAuth)
        expect(response.campaign).toBeDefined()
        expect(response.campaign.id).toBe(assignedCampaign.id)
      })

      it('campaign_editor cannot access unassigned campaign', async () => {
        const error = await $fetch(`/api/admin/campaigns/${unassignedCampaign.id}`, editorAuth).catch((e) => e)
        expect(error.statusCode).toBe(403)
      })
    })

    describe('Response', () => {
      it('returns campaign with expected fields', async () => {
        const response = await $fetch(`/api/admin/campaigns/${assignedCampaign.id}`, adminAuth)

        expect(response.campaign).toHaveProperty('id')
        expect(response.campaign).toHaveProperty('slug')
        expect(response.campaign).toHaveProperty('title')
        expect(response.campaign).toHaveProperty('status')
        expect(response.campaign).toHaveProperty('description')
      })

      it('returns 404 for non-existent campaign', async () => {
        const error = await $fetch('/api/admin/campaigns/999999', adminAuth).catch((e) => e)
        expect(error.statusCode).toBe(404)
      })

      it('returns 400 for invalid campaign ID', async () => {
        const error = await $fetch('/api/admin/campaigns/invalid', adminAuth).catch((e) => e)
        expect(error.statusCode).toBe(400)
      })
    })
  })

  describe('PUT /api/admin/campaigns/[campaignId]', () => {
    describe('Authorization', () => {
      it('returns 401 for unauthenticated requests', async () => {
        const error = await $fetch(`/api/admin/campaigns/${assignedCampaign.id}`, {
          method: 'PUT',
          body: { title: 'Updated Title' }
        }).catch((e) => e)

        expect(error.statusCode).toBe(401)
      })

      it('returns 403 for users with no role', async () => {
        const error = await $fetch(`/api/admin/campaigns/${assignedCampaign.id}`, {
          method: 'PUT',
          body: { title: 'Updated Title' },
          ...noRoleAuth
        }).catch((e) => e)

        expect(error.statusCode).toBe(403)
      })
    })

    describe('Access control', () => {
      it('admin can update any campaign', async () => {
        const response = await $fetch(`/api/admin/campaigns/${unassignedCampaign.id}`, {
          method: 'PUT',
          body: { title: 'Admin Updated' },
          ...adminAuth
        })

        expect(response.success).toBe(true)
        expect(response.campaign.title).toBe('Admin Updated')
      })

      it('campaign_editor can update assigned campaign', async () => {
        const response = await $fetch(`/api/admin/campaigns/${assignedCampaign.id}`, {
          method: 'PUT',
          body: { title: 'Editor Updated' },
          ...editorAuth
        })

        expect(response.success).toBe(true)
        expect(response.campaign.title).toBe('Editor Updated')
      })

      it('campaign_editor cannot update unassigned campaign', async () => {
        const error = await $fetch(`/api/admin/campaigns/${unassignedCampaign.id}`, {
          method: 'PUT',
          body: { title: 'Should Fail' },
          ...editorAuth
        }).catch((e) => e)

        expect(error.statusCode).toBe(403)
      })
    })

    describe('Update operations', () => {
      it('updates title', async () => {
        const response = await $fetch(`/api/admin/campaigns/${assignedCampaign.id}`, {
          method: 'PUT',
          body: { title: 'New Title' },
          ...adminAuth
        })

        expect(response.campaign.title).toBe('New Title')
      })

      it('updates description', async () => {
        const response = await $fetch(`/api/admin/campaigns/${assignedCampaign.id}`, {
          method: 'PUT',
          body: { description: 'New description' },
          ...adminAuth
        })

        expect(response.campaign.description).toBe('New description')
      })

      it('updates status', async () => {
        const response = await $fetch(`/api/admin/campaigns/${assignedCampaign.id}`, {
          method: 'PUT',
          body: { status: 'inactive' },
          ...adminAuth
        })

        expect(response.campaign.status).toBe('inactive')
      })

      it('validates slug uniqueness', async () => {
        const error = await $fetch(`/api/admin/campaigns/${assignedCampaign.id}`, {
          method: 'PUT',
          body: { slug: unassignedCampaign.slug },
          ...adminAuth
        }).catch((e) => e)

        expect(error.statusCode).toBe(400)
        expect(error.statusMessage.toLowerCase()).toContain('slug')
      })
    })
  })

  describe('DELETE /api/admin/campaigns/[campaignId]', () => {
    describe('Authorization', () => {
      it('returns 401 for unauthenticated requests', async () => {
        const campaign = await createTestCampaign(sql, { title: 'To Delete Unauth' })
        const error = await $fetch(`/api/admin/campaigns/${campaign.id}`, {
          method: 'DELETE'
        }).catch((e) => e)

        expect(error.statusCode).toBe(401)
      })

      it('returns 403 for users with no role', async () => {
        const campaign = await createTestCampaign(sql, { title: 'To Delete No Role' })
        const error = await $fetch(`/api/admin/campaigns/${campaign.id}`, {
          method: 'DELETE',
          ...noRoleAuth
        }).catch((e) => e)

        expect(error.statusCode).toBe(403)
      })
    })

    describe('Access control', () => {
      it('admin can delete any campaign', async () => {
        const campaign = await createTestCampaign(sql, { title: 'Admin Delete' })

        const response = await $fetch(`/api/admin/campaigns/${campaign.id}`, {
          method: 'DELETE',
          ...adminAuth
        })

        expect(response.success).toBe(true)
      })

      it('campaign_editor can delete assigned campaign', async () => {
        const campaign = await createTestCampaign(sql, { title: 'Editor Delete' })
        await assignUserToCampaign(sql, editorUserId, campaign.id)

        const response = await $fetch(`/api/admin/campaigns/${campaign.id}`, {
          method: 'DELETE',
          ...editorAuth
        })

        expect(response.success).toBe(true)
      })

      it('campaign_editor cannot delete unassigned campaign', async () => {
        const campaign = await createTestCampaign(sql, { title: 'Editor Cannot Delete' })

        const error = await $fetch(`/api/admin/campaigns/${campaign.id}`, {
          method: 'DELETE',
          ...editorAuth
        }).catch((e) => e)

        expect(error.statusCode).toBe(403)
      })
    })

    describe('Deletion behavior', () => {
      it('returns 404 for non-existent campaign', async () => {
        const error = await $fetch('/api/admin/campaigns/999999', {
          method: 'DELETE',
          ...adminAuth
        }).catch((e) => e)

        expect(error.statusCode).toBe(404)
      })

      it('campaign is removed from database', async () => {
        const campaign = await createTestCampaign(sql, { title: 'Verify Delete' })

        await $fetch(`/api/admin/campaigns/${campaign.id}`, {
          method: 'DELETE',
          ...adminAuth
        })

        // Verify it's deleted
        const error = await $fetch(`/api/admin/campaigns/${campaign.id}`, adminAuth).catch((e) => e)
        expect(error.statusCode).toBe(404)
      })
    })
  })
})
