import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { $fetch } from '@nuxt/test-utils/e2e'
import {
  getTestDatabase,
  closeTestDatabase,
  cleanupTestData,
  createTestUserInvitation,
  getTestUserInvitation
} from '../../../helpers/db'
import {
  createAdminUser,
  createEditorUser
} from '../../../helpers/auth'

describe('User Invitations API', async () => {
  const sql = getTestDatabase()

  let adminAuth: { headers: { cookie: string } }
  let adminUserId: string
  let editorAuth: { headers: { cookie: string } }

  beforeAll(async () => {
    await cleanupTestData(sql)
    const admin = await createAdminUser(sql)
    adminAuth = admin.auth
    adminUserId = admin.user.id

    const editor = await createEditorUser(sql)
    editorAuth = editor.auth
  })

  afterEach(async () => {
    await sql`DELETE FROM user_invitations WHERE email LIKE 'test-%@example.com'`
  })

  afterAll(async () => {
    await cleanupTestData(sql)
    await closeTestDatabase()
  })

  describe('GET /api/admin/users/invitations', () => {
    describe('Authorization', () => {
      it('returns 401 for unauthenticated requests', async () => {
        const error = await $fetch('/api/admin/users/invitations').catch((e) => e)
        expect(error.statusCode).toBe(401)
      })

      it('returns 403 for non-admin users', async () => {
        const error = await $fetch('/api/admin/users/invitations', editorAuth).catch((e) => e)
        expect(error.statusCode).toBe(403)
      })

      it('succeeds for admin users', async () => {
        const response = await $fetch('/api/admin/users/invitations', adminAuth)
        expect(response.invitations).toBeDefined()
      })
    })

    describe('Response structure', () => {
      it('returns invitations array', async () => {
        // Create a test invitation
        await createTestUserInvitation(sql, {
          email: `test-list-${Date.now()}@example.com`,
          invited_by: adminUserId
        })

        const response = await $fetch('/api/admin/users/invitations', adminAuth)

        expect(response.invitations).toBeDefined()
        expect(Array.isArray(response.invitations)).toBe(true)
      })

      it('includes inviter information', async () => {
        const email = `test-inviter-${Date.now()}@example.com`
        await createTestUserInvitation(sql, {
          email,
          invited_by: adminUserId
        })

        const response = await $fetch('/api/admin/users/invitations', adminAuth)

        const invitation = response.invitations.find((i: any) => i.email === email)
        expect(invitation).toBeDefined()
        expect(invitation.inviter_email).toBeDefined()
      })
    })
  })

  describe('DELETE /api/admin/users/invitations/[id]', () => {
    describe('Authorization', () => {
      it('returns 401 for unauthenticated requests', async () => {
        const invitation = await createTestUserInvitation(sql, {
          email: `test-delete-unauth-${Date.now()}@example.com`,
          invited_by: adminUserId
        })

        const error = await $fetch(`/api/admin/users/invitations/${invitation.id}`, {
          method: 'DELETE'
        }).catch((e) => e)

        expect(error.statusCode).toBe(401)
      })

      it('returns 403 for non-admin users', async () => {
        const invitation = await createTestUserInvitation(sql, {
          email: `test-delete-editor-${Date.now()}@example.com`,
          invited_by: adminUserId
        })

        const error = await $fetch(`/api/admin/users/invitations/${invitation.id}`, {
          method: 'DELETE',
          ...editorAuth
        }).catch((e) => e)

        expect(error.statusCode).toBe(403)
      })

      it('succeeds for admin users', async () => {
        const invitation = await createTestUserInvitation(sql, {
          email: `test-delete-admin-${Date.now()}@example.com`,
          invited_by: adminUserId
        })

        const response = await $fetch(`/api/admin/users/invitations/${invitation.id}`, {
          method: 'DELETE',
          ...adminAuth
        })

        expect(response.success).toBe(true)
      })
    })

    describe('Deletion behavior', () => {
      it('revokes the invitation (soft delete)', async () => {
        const invitation = await createTestUserInvitation(sql, {
          email: `test-delete-verify-${Date.now()}@example.com`,
          invited_by: adminUserId
        })

        await $fetch(`/api/admin/users/invitations/${invitation.id}`, {
          method: 'DELETE',
          ...adminAuth
        })

        // The endpoint revokes (soft deletes) rather than hard deleting
        const revoked = await getTestUserInvitation(sql, invitation.id)
        expect(revoked).toBeDefined()
        expect(revoked?.status).toBe('revoked')
      })
    })

    describe('Validation', () => {
      it('returns 400 for invalid invitation ID', async () => {
        const error = await $fetch('/api/admin/users/invitations/invalid', {
          method: 'DELETE',
          ...adminAuth
        }).catch((e) => e)

        expect(error.statusCode).toBe(400)
      })

      it('returns 404 for non-existent invitation', async () => {
        const error = await $fetch('/api/admin/users/invitations/999999', {
          method: 'DELETE',
          ...adminAuth
        }).catch((e) => e)

        expect(error.statusCode).toBe(404)
      })
    })
  })

  describe('POST /api/admin/users/invitations/[id]/resend', () => {
    describe('Authorization', () => {
      it('returns 401 for unauthenticated requests', async () => {
        const invitation = await createTestUserInvitation(sql, {
          email: `test-resend-unauth-${Date.now()}@example.com`,
          invited_by: adminUserId
        })

        const error = await $fetch(`/api/admin/users/invitations/${invitation.id}/resend`, {
          method: 'POST'
        }).catch((e) => e)

        expect(error.statusCode).toBe(401)
      })

      it('returns 403 for non-admin users', async () => {
        const invitation = await createTestUserInvitation(sql, {
          email: `test-resend-editor-${Date.now()}@example.com`,
          invited_by: adminUserId
        })

        const error = await $fetch(`/api/admin/users/invitations/${invitation.id}/resend`, {
          method: 'POST',
          ...editorAuth
        }).catch((e) => e)

        expect(error.statusCode).toBe(403)
      })

      it('succeeds for admin users (or fails due to email config, not auth)', async () => {
        const invitation = await createTestUserInvitation(sql, {
          email: `test-resend-admin-${Date.now()}@example.com`,
          invited_by: adminUserId
        })

        const response = await $fetch(`/api/admin/users/invitations/${invitation.id}/resend`, {
          method: 'POST',
          ...adminAuth
        }).catch((e) => e)

        // Either succeeds or fails due to email config (500), but NOT auth (401/403)
        if (response.statusCode) {
          expect(response.statusCode).toBe(500) // Email config error is acceptable
        } else {
          expect(response.message).toContain('resent')
        }
      })
    })

    describe('Validation', () => {
      it('returns 400 for invalid invitation ID', async () => {
        const error = await $fetch('/api/admin/users/invitations/invalid/resend', {
          method: 'POST',
          ...adminAuth
        }).catch((e) => e)

        expect(error.statusCode).toBe(400)
      })

      it('returns 404 for non-existent invitation', async () => {
        const error = await $fetch('/api/admin/users/invitations/999999/resend', {
          method: 'POST',
          ...adminAuth
        }).catch((e) => e)

        expect(error.statusCode).toBe(404)
      })
    })
  })
})
