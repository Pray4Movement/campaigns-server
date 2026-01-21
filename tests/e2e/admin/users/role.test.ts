import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import {
  getTestDatabase,
  closeTestDatabase,
  cleanupTestData,
  getTestUser
} from '../../../helpers/db'
import {
  createAdminUser,
  createEditorUser,
  createNoRoleUser
} from '../../../helpers/auth'

describe('PUT /api/admin/users/[id]/role', async () => {
  await setup({ server: true, browser: false })
  const sql = getTestDatabase()

  let adminAuth: { headers: { cookie: string } }
  let editorAuth: { headers: { cookie: string } }
  let targetUserId: string

  beforeAll(async () => {
    await cleanupTestData(sql)
    const admin = await createAdminUser(sql)
    adminAuth = admin.auth

    const editor = await createEditorUser(sql)
    editorAuth = editor.auth

    // Create a target user whose role we'll modify
    const target = await createNoRoleUser(sql)
    targetUserId = target.user.id
  })

  afterAll(async () => {
    await cleanupTestData(sql)
    await closeTestDatabase()
  })

  describe('Authorization', () => {
    it('returns 401 for unauthenticated requests', async () => {
      const error = await $fetch(`/api/admin/users/${targetUserId}/role`, {
        method: 'PUT',
        body: { role: 'admin' }
      }).catch((e) => e)

      expect(error.statusCode).toBe(401)
    })

    it('returns 403 for non-admin users', async () => {
      const error = await $fetch(`/api/admin/users/${targetUserId}/role`, {
        method: 'PUT',
        body: { role: 'admin' },
        ...editorAuth
      }).catch((e) => e)

      expect(error.statusCode).toBe(403)
    })

    it('succeeds for admin users', async () => {
      const response = await $fetch(`/api/admin/users/${targetUserId}/role`, {
        method: 'PUT',
        body: { role: 'campaign_editor' },
        ...adminAuth
      })

      expect(response.success).toBe(true)
    })
  })

  describe('Role updates', () => {
    it('can set role to admin', async () => {
      const response = await $fetch(`/api/admin/users/${targetUserId}/role`, {
        method: 'PUT',
        body: { role: 'admin' },
        ...adminAuth
      })

      expect(response.success).toBe(true)

      const user = await getTestUser(sql, targetUserId)
      expect(user?.role).toBe('admin')
    })

    it('can set role to campaign_editor', async () => {
      const response = await $fetch(`/api/admin/users/${targetUserId}/role`, {
        method: 'PUT',
        body: { role: 'campaign_editor' },
        ...adminAuth
      })

      expect(response.success).toBe(true)

      const user = await getTestUser(sql, targetUserId)
      expect(user?.role).toBe('campaign_editor')
    })

    it('can remove role (set to null)', async () => {
      const response = await $fetch(`/api/admin/users/${targetUserId}/role`, {
        method: 'PUT',
        body: { role: null },
        ...adminAuth
      })

      expect(response.success).toBe(true)

      const user = await getTestUser(sql, targetUserId)
      expect(user?.role).toBeNull()
    })
  })

  describe('Validation', () => {
    it('returns 400 for invalid user ID', async () => {
      const error = await $fetch('/api/admin/users/invalid-id/role', {
        method: 'PUT',
        body: { role: 'admin' },
        ...adminAuth
      }).catch((e) => e)

      expect(error.statusCode).toBe(400)
    })

    it('returns 404 for non-existent user', async () => {
      const fakeUuid = '00000000-0000-0000-0000-000000000000'
      const error = await $fetch(`/api/admin/users/${fakeUuid}/role`, {
        method: 'PUT',
        body: { role: 'admin' },
        ...adminAuth
      }).catch((e) => e)

      expect(error.statusCode).toBe(404)
    })
  })
})
