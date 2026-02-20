import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { $fetch } from '@nuxt/test-utils/e2e'
import {
  getTestDatabase,
  closeTestDatabase,
  cleanupTestData,
  createTestPeopleGroup,
  assignUserToPeopleGroup,
  getUserPeopleGroupAccess
} from '../../../helpers/db'
import {
  createAdminUser,
  createEditorUser,
  createNoRoleUser
} from '../../../helpers/auth'

describe('User People Group Access API', async () => {
  const sql = getTestDatabase()

  let adminAuth: { headers: { cookie: string } }
  let editorAuth: { headers: { cookie: string } }
  let targetUserId: string
  let peopleGroup1: { id: number; slug: string }
  let peopleGroup2: { id: number; slug: string }

  beforeAll(async () => {
    await cleanupTestData(sql)

    const admin = await createAdminUser(sql)
    adminAuth = admin.auth

    const editor = await createEditorUser(sql)
    editorAuth = editor.auth

    // Create a target user whose people group access we'll manage
    const target = await createNoRoleUser(sql)
    targetUserId = target.user.id

    // Create test people groups
    peopleGroup1 = await createTestPeopleGroup(sql, { title: 'Test People Group 1' })
    peopleGroup2 = await createTestPeopleGroup(sql, { title: 'Test People Group 2' })
  })

  afterAll(async () => {
    await cleanupTestData(sql)
    await closeTestDatabase()
  })

  describe('GET /api/admin/users/[id]/people-groups', () => {
    describe('Authorization', () => {
      it('returns 401 for unauthenticated requests', async () => {
        const error = await $fetch(`/api/admin/users/${targetUserId}/people-groups`).catch((e) => e)
        expect(error.statusCode).toBe(401)
      })

      it('returns 403 for non-admin users', async () => {
        const error = await $fetch(`/api/admin/users/${targetUserId}/people-groups`, editorAuth).catch((e) => e)
        expect(error.statusCode).toBe(403)
      })

      it('succeeds for admin users', async () => {
        const response = await $fetch(`/api/admin/users/${targetUserId}/people-groups`, adminAuth)
        expect(response.peopleGroups).toBeDefined()
      })
    })

    describe('Response structure', () => {
      it('returns all people groups with hasAccess flag', async () => {
        // First assign user to peopleGroup1
        await assignUserToPeopleGroup(sql, targetUserId, peopleGroup1.id)

        const response = await $fetch(`/api/admin/users/${targetUserId}/people-groups`, adminAuth)

        expect(response.success).toBe(true)
        expect(response.peopleGroups).toBeDefined()
        expect(Array.isArray(response.peopleGroups)).toBe(true)

        // Find our test people groups
        const c1 = response.peopleGroups.find((c: any) => c.id === peopleGroup1.id)
        const c2 = response.peopleGroups.find((c: any) => c.id === peopleGroup2.id)

        expect(c1?.hasAccess).toBe(true)
        expect(c2?.hasAccess).toBe(false)
      })
    })

    describe('Validation', () => {
      it('returns 400 for invalid user ID', async () => {
        const error = await $fetch('/api/admin/users/invalid-id/people-groups', adminAuth).catch((e) => e)
        expect(error.statusCode).toBe(400)
      })
    })
  })

  describe('PUT /api/admin/users/[id]/people-groups', () => {
    describe('Authorization', () => {
      it('returns 401 for unauthenticated requests', async () => {
        const error = await $fetch(`/api/admin/users/${targetUserId}/people-groups`, {
          method: 'PUT',
          body: { people_group_ids: [peopleGroup1.id] }
        }).catch((e) => e)

        expect(error.statusCode).toBe(401)
      })

      it('returns 403 for non-admin users', async () => {
        const error = await $fetch(`/api/admin/users/${targetUserId}/people-groups`, {
          method: 'PUT',
          body: { people_group_ids: [peopleGroup1.id] },
          ...editorAuth
        }).catch((e) => e)

        expect(error.statusCode).toBe(403)
      })

      it('succeeds for admin users', async () => {
        const response = await $fetch(`/api/admin/users/${targetUserId}/people-groups`, {
          method: 'PUT',
          body: { people_group_ids: [peopleGroup1.id] },
          ...adminAuth
        })

        expect(response.success).toBe(true)
      })
    })

    describe('People group assignment', () => {
      it('assigns user to multiple people groups', async () => {
        const response = await $fetch(`/api/admin/users/${targetUserId}/people-groups`, {
          method: 'PUT',
          body: { people_group_ids: [peopleGroup1.id, peopleGroup2.id] },
          ...adminAuth
        })

        expect(response.success).toBe(true)

        const access = await getUserPeopleGroupAccess(sql, targetUserId)
        expect(access).toContain(peopleGroup1.id)
        expect(access).toContain(peopleGroup2.id)
      })

      it('removes existing people group access and replaces with new list', async () => {
        // First assign to both people groups
        await $fetch(`/api/admin/users/${targetUserId}/people-groups`, {
          method: 'PUT',
          body: { people_group_ids: [peopleGroup1.id, peopleGroup2.id] },
          ...adminAuth
        })

        // Now assign to only peopleGroup1
        const response = await $fetch(`/api/admin/users/${targetUserId}/people-groups`, {
          method: 'PUT',
          body: { people_group_ids: [peopleGroup1.id] },
          ...adminAuth
        })

        expect(response.success).toBe(true)

        const access = await getUserPeopleGroupAccess(sql, targetUserId)
        expect(access).toContain(peopleGroup1.id)
        expect(access).not.toContain(peopleGroup2.id)
      })

      it('can remove all people group access', async () => {
        // First assign to a people group
        await assignUserToPeopleGroup(sql, targetUserId, peopleGroup1.id)

        // Remove all access
        const response = await $fetch(`/api/admin/users/${targetUserId}/people-groups`, {
          method: 'PUT',
          body: { people_group_ids: [] },
          ...adminAuth
        })

        expect(response.success).toBe(true)

        const access = await getUserPeopleGroupAccess(sql, targetUserId)
        expect(access).toHaveLength(0)
      })
    })

    describe('Validation', () => {
      it('returns 400 for invalid user ID', async () => {
        const error = await $fetch('/api/admin/users/invalid-id/people-groups', {
          method: 'PUT',
          body: { people_group_ids: [] },
          ...adminAuth
        }).catch((e) => e)

        expect(error.statusCode).toBe(400)
      })

      it('returns 400 for missing people_group_ids', async () => {
        const error = await $fetch(`/api/admin/users/${targetUserId}/people-groups`, {
          method: 'PUT',
          body: {},
          ...adminAuth
        }).catch((e) => e)

        expect(error.statusCode).toBe(400)
      })

      it('returns 400 for non-array people_group_ids', async () => {
        const error = await $fetch(`/api/admin/users/${targetUserId}/people-groups`, {
          method: 'PUT',
          body: { people_group_ids: 'not-an-array' },
          ...adminAuth
        }).catch((e) => e)

        expect(error.statusCode).toBe(400)
      })

      it('returns 404 for non-existent user', async () => {
        const fakeUuid = '00000000-0000-0000-0000-000000000000'
        const error = await $fetch(`/api/admin/users/${fakeUuid}/people-groups`, {
          method: 'PUT',
          body: { people_group_ids: [] },
          ...adminAuth
        }).catch((e) => e)

        expect(error.statusCode).toBe(404)
      })
    })
  })
})
