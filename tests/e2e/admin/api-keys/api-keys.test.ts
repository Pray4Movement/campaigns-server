import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { $fetch } from '@nuxt/test-utils/e2e'
import {
  getTestDatabase,
  closeTestDatabase,
  cleanupTestData
} from '../../../helpers/db'
import {
  createAdminUser,
  createEditorUser,
  createNoRoleUser
} from '../../../helpers/auth'

describe('API Keys', async () => {
  const sql = getTestDatabase()

  let adminAuth: { headers: { cookie: string } }
  let adminUserId: string
  let editorAuth: { headers: { cookie: string } }
  let noRoleAuth: { headers: { cookie: string } }

  beforeAll(async () => {
    await cleanupTestData(sql)
    const admin = await createAdminUser(sql, { display_name: 'API Key Admin' })
    adminAuth = admin.auth
    adminUserId = admin.user.id

    const editor = await createEditorUser(sql, { display_name: 'API Key Editor' })
    editorAuth = editor.auth

    const noRole = await createNoRoleUser(sql, { display_name: 'API Key No Role' })
    noRoleAuth = noRole.auth
  })

  afterAll(async () => {
    await cleanupTestData(sql)
    await closeTestDatabase()
  })

  describe('POST /api/admin/api-keys (create)', () => {
    it('returns 401 for unauthenticated requests', async () => {
      const error = await $fetch('/api/admin/api-keys', {
        method: 'POST',
        body: { name: 'Test Key' }
      }).catch((e) => e)
      expect(error.statusCode).toBe(401)
    })

    it('returns 403 for non-admin users', async () => {
      const error = await $fetch('/api/admin/api-keys', {
        method: 'POST',
        body: { name: 'Test Key' },
        ...editorAuth
      }).catch((e) => e)
      expect(error.statusCode).toBe(403)
    })

    it('returns 403 for users with no role', async () => {
      const error = await $fetch('/api/admin/api-keys', {
        method: 'POST',
        body: { name: 'Test Key' },
        ...noRoleAuth
      }).catch((e) => e)
      expect(error.statusCode).toBe(403)
    })

    it('returns 400 when name is missing', async () => {
      const error = await $fetch('/api/admin/api-keys', {
        method: 'POST',
        body: {},
        ...adminAuth
      }).catch((e) => e)
      expect(error.statusCode).toBe(400)
    })

    it('creates a key and returns plaintext once', async () => {
      const response = await $fetch('/api/admin/api-keys', {
        method: 'POST',
        body: { name: 'CI Pipeline' },
        ...adminAuth
      })

      expect(response.plaintext_key).toBeDefined()
      expect(response.plaintext_key).toMatch(/^dxk_[0-9a-f]{40}$/)
      expect(response.key).toBeDefined()
      expect(response.key.name).toBe('CI Pipeline')
      expect(response.key.key_prefix).toBe(response.plaintext_key.substring(0, 8))
    })
  })

  describe('GET /api/admin/api-keys (list)', () => {
    it('returns 401 for unauthenticated requests', async () => {
      const error = await $fetch('/api/admin/api-keys').catch((e) => e)
      expect(error.statusCode).toBe(401)
    })

    it('returns 403 for non-admin users', async () => {
      const error = await $fetch('/api/admin/api-keys', editorAuth).catch((e) => e)
      expect(error.statusCode).toBe(403)
    })

    it('lists keys for the authenticated admin', async () => {
      const response = await $fetch('/api/admin/api-keys', adminAuth)

      expect(response.keys).toBeDefined()
      expect(Array.isArray(response.keys)).toBe(true)
      expect(response.keys.length).toBeGreaterThan(0)

      const key = response.keys[0]
      expect(key).toHaveProperty('id')
      expect(key).toHaveProperty('name')
      expect(key).toHaveProperty('key_prefix')
      expect(key).toHaveProperty('created_at')
      expect(key).not.toHaveProperty('key_hash')
    })
  })

  describe('DELETE /api/admin/api-keys/:id (revoke)', () => {
    let keyToRevoke: number

    beforeAll(async () => {
      const response = await $fetch('/api/admin/api-keys', {
        method: 'POST',
        body: { name: 'Key To Revoke' },
        ...adminAuth
      })
      keyToRevoke = response.key.id
    })

    it('returns 401 for unauthenticated requests', async () => {
      const error = await $fetch(`/api/admin/api-keys/${keyToRevoke}`, {
        method: 'DELETE'
      }).catch((e) => e)
      expect(error.statusCode).toBe(401)
    })

    it('returns 404 when revoking another user\'s key', async () => {
      // Create a second admin and try to revoke the first admin's key
      const admin2 = await createAdminUser(sql, { display_name: 'Other Admin' })
      const error = await $fetch(`/api/admin/api-keys/${keyToRevoke}`, {
        method: 'DELETE',
        ...admin2.auth
      }).catch((e) => e)
      expect(error.statusCode).toBe(404)
    })

    it('revokes a key successfully', async () => {
      const response = await $fetch(`/api/admin/api-keys/${keyToRevoke}`, {
        method: 'DELETE',
        ...adminAuth
      })
      expect(response.success).toBe(true)

      // Verify it no longer appears in the list
      const list = await $fetch('/api/admin/api-keys', adminAuth)
      const found = list.keys.find((k: any) => k.id === keyToRevoke)
      expect(found).toBeUndefined()
    })

    it('returns 404 when revoking an already-revoked key', async () => {
      const error = await $fetch(`/api/admin/api-keys/${keyToRevoke}`, {
        method: 'DELETE',
        ...adminAuth
      }).catch((e) => e)
      expect(error.statusCode).toBe(404)
    })
  })

  describe('API key authentication via middleware', () => {
    let plaintextKey: string

    beforeAll(async () => {
      const response = await $fetch('/api/admin/api-keys', {
        method: 'POST',
        body: { name: 'Auth Test Key' },
        ...adminAuth
      })
      plaintextKey = response.plaintext_key
    })

    it('authenticates with Authorization: Bearer header', async () => {
      const response = await $fetch('/api/admin/campaigns', {
        headers: { authorization: `Bearer ${plaintextKey}` }
      })
      expect(response.campaigns).toBeDefined()
    })

    it('authenticates with X-API-Key header', async () => {
      const response = await $fetch('/api/admin/campaigns', {
        headers: { 'x-api-key': plaintextKey }
      })
      expect(response.campaigns).toBeDefined()
    })

    it('rejects an invalid key', async () => {
      const error = await $fetch('/api/admin/campaigns', {
        headers: { authorization: 'Bearer dxk_0000000000000000000000000000000000000000' }
      }).catch((e) => e)
      expect(error.statusCode).toBe(401)
    })

    it('rejects a revoked key', async () => {
      // Create and immediately revoke a key
      const created = await $fetch('/api/admin/api-keys', {
        method: 'POST',
        body: { name: 'Revoke Auth Test' },
        ...adminAuth
      })
      await $fetch(`/api/admin/api-keys/${created.key.id}`, {
        method: 'DELETE',
        ...adminAuth
      })

      const error = await $fetch('/api/admin/campaigns', {
        headers: { authorization: `Bearer ${created.plaintext_key}` }
      }).catch((e) => e)
      expect(error.statusCode).toBe(401)
    })

    it('rejects API key auth on API key management endpoints', async () => {
      const error = await $fetch('/api/admin/api-keys', {
        headers: { authorization: `Bearer ${plaintextKey}` }
      }).catch((e) => e)
      expect(error.statusCode).toBe(403)
    })
  })
})
