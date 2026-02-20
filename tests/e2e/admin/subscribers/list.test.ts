import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { $fetch } from '@nuxt/test-utils/e2e'
import {
  getTestDatabase,
  closeTestDatabase,
  cleanupTestData,
  createTestPeopleGroup,
  createTestSubscriber,
  createTestContactMethod,
  createTestPeopleGroupSubscription,
  assignUserToPeopleGroup
} from '../../../helpers/db'
import {
  createAdminUser,
  createEditorUser,
  createNoRoleUser
} from '../../../helpers/auth'

describe('GET /api/admin/subscribers', async () => {
  const sql = getTestDatabase()

  let adminAuth: { headers: { cookie: string } }
  let editorAuth: { headers: { cookie: string } }
  let editorUserId: string
  let noRoleAuth: { headers: { cookie: string } }
  let peopleGroup1: { id: number; slug: string }
  let peopleGroup2: { id: number; slug: string }

  beforeAll(async () => {
    await cleanupTestData(sql)

    const admin = await createAdminUser(sql)
    adminAuth = admin.auth

    const editor = await createEditorUser(sql)
    editorAuth = editor.auth
    editorUserId = editor.user.id

    const noRole = await createNoRoleUser(sql)
    noRoleAuth = noRole.auth

    // Create people groups
    peopleGroup1 = await createTestPeopleGroup(sql, { title: 'People Group 1' })
    peopleGroup2 = await createTestPeopleGroup(sql, { title: 'People Group 2' })

    // Assign editor to peopleGroup1 only
    await assignUserToPeopleGroup(sql, editorUserId, peopleGroup1.id)

    // Create subscribers in peopleGroup1
    for (let i = 0; i < 2; i++) {
      const subscriber = await createTestSubscriber(sql, { name: `Test Sub C1 ${i}` })
      await createTestContactMethod(sql, subscriber.id, {
        value: `test-c1-${i}-${Date.now()}@example.com`,
        verified: true
      })
      await createTestPeopleGroupSubscription(sql, peopleGroup1.id, subscriber.id)
    }

    // Create subscribers in peopleGroup2
    for (let i = 0; i < 2; i++) {
      const subscriber = await createTestSubscriber(sql, { name: `Test Sub C2 ${i}` })
      await createTestContactMethod(sql, subscriber.id, {
        value: `test-c2-${i}-${Date.now()}@example.com`,
        verified: true
      })
      await createTestPeopleGroupSubscription(sql, peopleGroup2.id, subscriber.id)
    }
  })

  afterAll(async () => {
    await cleanupTestData(sql)
    await closeTestDatabase()
  })

  describe('Authorization', () => {
    it('returns 401 for unauthenticated requests', async () => {
      const error = await $fetch('/api/admin/subscribers').catch((e) => e)
      expect(error.statusCode).toBe(401)
    })

    it('returns 403 for users with no role', async () => {
      const error = await $fetch('/api/admin/subscribers', noRoleAuth).catch((e) => e)
      expect(error.statusCode).toBe(403)
    })

    it('succeeds for admin users', async () => {
      const response = await $fetch('/api/admin/subscribers', adminAuth)
      expect(response.subscribers).toBeDefined()
    })

    it('succeeds for people_group_editor users', async () => {
      const response = await $fetch('/api/admin/subscribers', editorAuth)
      expect(response.subscribers).toBeDefined()
    })
  })

  describe('People group-based filtering', () => {
    it('admin sees all subscribers', async () => {
      const response = await $fetch('/api/admin/subscribers', adminAuth)

      // Should see subscribers from both people groups
      const names = response.subscribers.map((s: any) => s.name)
      expect(names.some((n: string) => n.includes('C1'))).toBe(true)
      expect(names.some((n: string) => n.includes('C2'))).toBe(true)
    })

    it('people_group_editor sees only subscribers from assigned people groups', async () => {
      const response = await $fetch('/api/admin/subscribers', editorAuth)

      // Should only see subscribers from peopleGroup1
      const names = response.subscribers.map((s: any) => s.name)
      expect(names.some((n: string) => n.includes('C1'))).toBe(true)
      expect(names.every((n: string) => !n.includes('C2'))).toBe(true)
    })

    it('admin can filter by people_group_id', async () => {
      const response = await $fetch(`/api/admin/subscribers?people_group_id=${peopleGroup1.id}`, adminAuth)

      const names = response.subscribers.map((s: any) => s.name)
      expect(names.every((n: string) => n.includes('C1'))).toBe(true)
    })

    it('people_group_editor cannot filter by unassigned people_group_id', async () => {
      const error = await $fetch(`/api/admin/subscribers?people_group_id=${peopleGroup2.id}`, editorAuth).catch((e) => e)
      expect(error.statusCode).toBe(403)
    })
  })

  describe('Search', () => {
    it('supports search by name', async () => {
      const response = await $fetch('/api/admin/subscribers?search=Test%20Sub%20C1%200', adminAuth)

      expect(response.subscribers).toBeDefined()
      expect(response.subscribers.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Response structure', () => {
    it('returns subscribers array', async () => {
      const response = await $fetch('/api/admin/subscribers', adminAuth)

      expect(response.subscribers).toBeDefined()
      expect(Array.isArray(response.subscribers)).toBe(true)
    })
  })
})
