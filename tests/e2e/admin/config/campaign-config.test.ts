import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
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

describe('Campaign Config API', async () => {
  await setup({ server: true, browser: false })
  const sql = getTestDatabase()

  let adminAuth: { headers: { cookie: string } }
  let editorAuth: { headers: { cookie: string } }
  let noRoleAuth: { headers: { cookie: string } }

  beforeAll(async () => {
    await cleanupTestData(sql)

    const admin = await createAdminUser(sql)
    adminAuth = admin.auth

    const editor = await createEditorUser(sql)
    editorAuth = editor.auth

    const noRole = await createNoRoleUser(sql)
    noRoleAuth = noRole.auth
  })

  afterAll(async () => {
    await cleanupTestData(sql)
    await closeTestDatabase()
  })

  describe('GET /api/admin/campaign-config/libraries', () => {
    it('returns 401 for unauthenticated requests', async () => {
      const error = await $fetch('/api/admin/campaign-config/libraries').catch((e) => e)
      expect(error.statusCode).toBe(401)
    })

    it('returns 403 for users with no role', async () => {
      const error = await $fetch('/api/admin/campaign-config/libraries', noRoleAuth).catch((e) => e)
      expect(error.statusCode).toBe(403)
    })

    it('succeeds for admin users', async () => {
      const response = await $fetch('/api/admin/campaign-config/libraries', adminAuth)
      expect(response).toBeDefined()
    })

    it('returns 403 for campaign_editor users (admin only)', async () => {
      const error = await $fetch('/api/admin/campaign-config/libraries', editorAuth).catch((e) => e)
      expect(error.statusCode).toBe(403)
    })
  })

  describe('PUT /api/admin/campaign-config/libraries', () => {
    it('returns 401 for unauthenticated requests', async () => {
      const error = await $fetch('/api/admin/campaign-config/libraries', {
        method: 'PUT',
        body: { config: {} }
      }).catch((e) => e)

      expect(error.statusCode).toBe(401)
    })

    it('returns 403 for users with no role', async () => {
      const error = await $fetch('/api/admin/campaign-config/libraries', {
        method: 'PUT',
        body: { config: {} },
        ...noRoleAuth
      }).catch((e) => e)

      expect(error.statusCode).toBe(403)
    })

    it('succeeds for admin users', async () => {
      // Send valid config format
      const response = await $fetch('/api/admin/campaign-config/libraries', {
        method: 'PUT',
        body: {
          rows: [],
          global_start_date: '2025-01-01'
        },
        ...adminAuth
      })

      expect(response.config).toBeDefined()
    })
  })
})
