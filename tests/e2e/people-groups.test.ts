import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { $fetch } from '@nuxt/test-utils/e2e'
import { getTestDatabase, closeTestDatabase, cleanupTestData, createTestPeopleGroup } from '../helpers/db'

describe('GET /api/people-groups', async () => {
  const sql = getTestDatabase()

  afterEach(async () => {
    await cleanupTestData(sql)
  })

  afterAll(async () => {
    await closeTestDatabase()
  })

  it('returns empty array when no people groups exist', async () => {
    const response = await $fetch('/api/people-groups')

    expect(response).toHaveProperty('peopleGroups')
    expect(Array.isArray(response.peopleGroups)).toBe(true)
  })

  it('returns people groups', async () => {
    const peopleGroup = await createTestPeopleGroup(sql, {
      title: 'Test Prayer People Group'
    })

    const response = await $fetch('/api/people-groups')

    expect(response.peopleGroups).toContainEqual(
      expect.objectContaining({
        slug: peopleGroup.slug,
        title: 'Test Prayer People Group'
      })
    )
  })
})
