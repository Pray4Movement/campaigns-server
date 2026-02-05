/**
 * GET /api/people-groups/all
 * Get all people groups with customizable raw fields (no label formatting)
 * Use ?fields=field1,field2 for custom fields or ?fields=all for everything
 * Useful for map widgets and engagement data
 */
import { getDatabase } from '../../database/db'
import { formatPeopleGroupRaw, DEFAULT_ALL_FIELDS } from '../../utils/app/people-group-formatter'
import { allFields } from '../../utils/app/field-options'
import { setCorsHeaders, setCacheHeaders } from '../../utils/app/cors'

export default defineEventHandler(async (event) => {
  // Set CORS and cache headers
  setCorsHeaders(event)
  setCacheHeaders(event)

  // Parse query params
  const query = getQuery(event)
  const fieldsParam = query.fields as string | undefined

  // Determine which fields to return
  let requestedFields: string[]

  if (fieldsParam === 'all') {
    // Return all available fields
    requestedFields = ['dt_id', 'slug', ...allFields.map(f => f.key)]
  } else if (fieldsParam) {
    // Parse comma-separated field names
    requestedFields = fieldsParam.split(',').map(f => f.trim()).filter(Boolean)
    // Always include dt_id if not specified
    if (!requestedFields.includes('dt_id')) {
      requestedFields.unshift('dt_id')
    }
  } else {
    // Use default fields
    requestedFields = ['dt_id', ...DEFAULT_ALL_FIELDS]
  }

  const db = getDatabase()

  // Query all people groups
  const stmt = db.prepare(`
    SELECT *
    FROM people_groups
    ORDER BY name
  `)

  const peopleGroups = await stmt.all() as any[]

  // Format the response with raw values
  const posts = peopleGroups.map(pg => formatPeopleGroupRaw(pg, requestedFields))

  return {
    posts,
    total: posts.length
  }
})
