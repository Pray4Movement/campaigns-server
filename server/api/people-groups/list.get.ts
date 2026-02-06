/**
 * GET /api/people-groups/list
 * List all people groups with summary data
 * Supports translated labels via ?lang= query param
 */
import { getDatabase } from '../../database/db'
import {
  formatPeopleGroupForList,
  formatPeopleGroupForListWithFields,
  DEFAULT_LIST_FIELDS
} from '../../utils/app/people-group-formatter'
import { setCorsHeaders, setCacheHeaders } from '../../utils/app/cors'
import { LANGUAGE_CODES } from '../../../config/languages'

export default defineEventHandler(async (event) => {
  // Set CORS and cache headers
  setCorsHeaders(event)
  setCacheHeaders(event)

  // Parse query params
  const query = getQuery(event)
  const lang = LANGUAGE_CODES.includes(query.lang as string) ? query.lang as string : 'en'
  const fieldsParam = query.fields as string | undefined

  // Parse requested fields
  const requestedFields = fieldsParam
    ? fieldsParam.split(',').map(f => f.trim()).filter(Boolean)
    : null

  const db = getDatabase()

  // Query all people groups with aggregated people_praying from campaigns
  const stmt = db.prepare(`
    SELECT
      pg.*,
      COALESCE(SUM(c.people_praying), 0)::INTEGER as total_people_praying
    FROM people_groups pg
    LEFT JOIN campaigns c ON c.dt_id = pg.dt_id
    GROUP BY pg.id
    ORDER BY pg.name
  `)

  const peopleGroups = await stmt.all() as any[]

  // Format the response
  const posts = peopleGroups.map(pg => {
    if (requestedFields) {
      return formatPeopleGroupForListWithFields(pg, requestedFields, lang)
    }
    return formatPeopleGroupForList(pg, lang)
  })

  return {
    posts,
    total: posts.length
  }
})
