import { peopleGroupService, UpdatePeopleGroupData } from '../../../database/people-groups'
import { getDatabase } from '#server/database/db'
import { handleApiError, getErrorMessage } from '#server/utils/api-helpers'

interface BulkUpdateItem {
  id?: number
  slug?: string
  name?: string
  image_url?: string | null
  joshua_project_id?: string | null
  metadata?: Record<string, any>
  country_code?: string | null
  region?: string | null
  latitude?: number | null
  longitude?: number | null
  population?: number | null
  evangelical_pct?: number | null
  engagement_status?: string | null
  primary_religion?: string | null
  primary_language?: string | null
  descriptions?: Record<string, string> | null
}

interface BulkUpdateBody {
  updates: BulkUpdateItem[]
}

interface BulkUpdateError {
  index: number
  identifier: string
  message: string
}

export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event)

    const body = await readBody<BulkUpdateBody>(event)

    if (!body?.updates || !Array.isArray(body.updates)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Request body must contain an "updates" array'
      })
    }

    if (body.updates.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Updates array must not be empty'
      })
    }

    if (body.updates.length > 500) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Updates array must not exceed 500 items'
      })
    }

    // Validate each item has id or slug
    for (let i = 0; i < body.updates.length; i++) {
      const item = body.updates[i]!
      if (item.id === undefined && !item.slug) {
        throw createError({
          statusCode: 400,
          statusMessage: `Item at index ${i} must have either "id" or "slug"`
        })
      }
    }

    // Batch resolve slugs to ids
    const slugsToResolve = body.updates
      .filter(item => item.slug && item.id === undefined)
      .map(item => item.slug!)

    const slugToIdMap = new Map<string, number>()

    if (slugsToResolve.length > 0) {
      const uniqueSlugs = [...new Set(slugsToResolve)]
      const db = getDatabase()
      const placeholders = uniqueSlugs.map(() => '?').join(',')
      const stmt = db.prepare(`SELECT id, slug FROM people_groups WHERE slug IN (${placeholders})`)
      const rows = await stmt.all(...uniqueSlugs) as { id: number; slug: string }[]
      for (const row of rows) {
        slugToIdMap.set(row.slug, row.id)
      }
    }

    // Process updates
    let updated = 0
    let notFound = 0
    let skipped = 0
    let errorCount = 0
    const errors: BulkUpdateError[] = []

    for (let i = 0; i < body.updates.length; i++) {
      const item = body.updates[i]!
      const identifier = item.id !== undefined ? `id:${item.id}` : `slug:${item.slug}`

      // Resolve the id
      let resolvedId: number | undefined
      if (item.id !== undefined) {
        resolvedId = item.id
      } else if (item.slug) {
        resolvedId = slugToIdMap.get(item.slug)
      }

      if (resolvedId === undefined) {
        notFound++
        if (errors.length < 50) {
          errors.push({ index: i, identifier, message: 'Not found' })
        }
        continue
      }

      // Build update data
      const updateData: UpdatePeopleGroupData = {}
      let hasFields = false

      if (item.name !== undefined) { updateData.name = item.name; hasFields = true }
      if (item.image_url !== undefined) { updateData.image_url = item.image_url; hasFields = true }
      if (item.joshua_project_id !== undefined) { updateData.joshua_project_id = item.joshua_project_id || null; hasFields = true }
      if (item.metadata !== undefined) { updateData.metadata = JSON.stringify(item.metadata); hasFields = true }
      if (item.country_code !== undefined) { updateData.country_code = item.country_code; hasFields = true }
      if (item.region !== undefined) { updateData.region = item.region; hasFields = true }
      if (item.latitude !== undefined) { updateData.latitude = item.latitude; hasFields = true }
      if (item.longitude !== undefined) { updateData.longitude = item.longitude; hasFields = true }
      if (item.population !== undefined) { updateData.population = item.population; hasFields = true }
      if (item.evangelical_pct !== undefined) { updateData.evangelical_pct = item.evangelical_pct; hasFields = true }
      if (item.engagement_status !== undefined) { updateData.engagement_status = item.engagement_status; hasFields = true }
      if (item.primary_religion !== undefined) { updateData.primary_religion = item.primary_religion; hasFields = true }
      if (item.primary_language !== undefined) { updateData.primary_language = item.primary_language; hasFields = true }
      if (item.descriptions !== undefined) { updateData.descriptions = item.descriptions; hasFields = true }

      if (!hasFields) {
        skipped++
        continue
      }

      try {
        const result = await peopleGroupService.updatePeopleGroup(resolvedId, updateData)
        if (result) {
          updated++
        } else {
          notFound++
          if (errors.length < 50) {
            errors.push({ index: i, identifier, message: 'Not found' })
          }
        }
      } catch (err) {
        errorCount++
        if (errors.length < 50) {
          errors.push({ index: i, identifier, message: getErrorMessage(err) })
        }
      }
    }

    const total = body.updates.length

    return {
      success: true,
      message: `Bulk update: ${updated} updated, ${notFound} not found, ${skipped} skipped, ${errorCount} errors`,
      stats: { total, updated, notFound, skipped, errors: errorCount },
      errors
    }
  } catch (error) {
    handleApiError(error, 'Failed to bulk update people groups')
    throw error
  }
})
