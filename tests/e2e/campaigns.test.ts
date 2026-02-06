import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { $fetch } from '@nuxt/test-utils/e2e'
import { getTestDatabase, closeTestDatabase, cleanupTestData, createTestCampaign } from '../helpers/db'

describe('GET /api/campaigns', async () => {
  const sql = getTestDatabase()

  afterEach(async () => {
    await cleanupTestData(sql)
  })

  afterAll(async () => {
    await closeTestDatabase()
  })

  it('returns empty array when no campaigns exist', async () => {
    const response = await $fetch('/api/campaigns')

    expect(response).toHaveProperty('campaigns')
    expect(Array.isArray(response.campaigns)).toBe(true)
  })

  it('returns active campaigns', async () => {
    const campaign = await createTestCampaign(sql, {
      title: 'Test Prayer Campaign',
      status: 'active'
    })

    const response = await $fetch('/api/campaigns')

    expect(response.campaigns).toContainEqual(
      expect.objectContaining({
        slug: campaign.slug,
        title: 'Test Prayer Campaign',
        status: 'active'
      })
    )
  })

  it('does not return inactive campaigns', async () => {
    await createTestCampaign(sql, {
      title: 'Inactive Campaign',
      slug: 'test-inactive',
      status: 'inactive'
    })

    const response = await $fetch('/api/campaigns')

    const slugs = response.campaigns.map((c: any) => c.slug)
    expect(slugs).not.toContain('test-inactive')
  })
})
