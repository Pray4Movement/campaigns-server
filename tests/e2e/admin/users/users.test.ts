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

describe('GET /api/admin/users', async () => {
  const sql = getTestDatabase()

  let adminAuth: { headers: { cookie: string } }
  let editorAuth: { headers: { cookie: string } }
  let noRoleAuth: { headers: { cookie: string } }

  beforeAll(async () => {
    await cleanupTestData(sql)
    const admin = await createAdminUser(sql, { display_name: 'Admin User' })
    adminAuth = admin.auth

    const editor = await createEditorUser(sql, { display_name: 'Editor User' })
    editorAuth = editor.auth

    const noRole = await createNoRoleUser(sql, { display_name: 'No Role User' })
    noRoleAuth = noRole.auth
  })

  afterAll(async () => {
    await cleanupTestData(sql)
    await closeTestDatabase()
  })

  describe('Authorization', () => {
    it('returns 401 for unauthenticated requests', async () => {
      const error = await $fetch('/api/admin/users').catch((e) => e)
      expect(error.statusCode).toBe(401)
    })

    it('returns 403 for non-admin users', async () => {
      const error = await $fetch('/api/admin/users', editorAuth).catch((e) => e)
      expect(error.statusCode).toBe(403)
    })

    it('returns 403 for users with no role', async () => {
      const error = await $fetch('/api/admin/users', noRoleAuth).catch((e) => e)
      expect(error.statusCode).toBe(403)
    })

    it('succeeds for admin users', async () => {
      const response = await $fetch('/api/admin/users', adminAuth)
      expect(response.users).toBeDefined()
      expect(Array.isArray(response.users)).toBe(true)
    })
  })

  describe('Response structure', () => {
    it('returns users array with expected fields', async () => {
      const response = await $fetch('/api/admin/users', adminAuth)

      expect(response.users).toBeDefined()
      expect(response.users.length).toBeGreaterThan(0)

      const user = response.users[0]
      expect(user).toHaveProperty('id')
      expect(user).toHaveProperty('email')
      expect(user).toHaveProperty('display_name')
    })

    it('includes test users in response', async () => {
      const response = await $fetch('/api/admin/users', adminAuth)

      const emails = response.users.map((u: any) => u.email)
      const hasTestUsers = emails.some((e: string) => e.includes('test-'))
      expect(hasTestUsers).toBe(true)
    })
  })
})
