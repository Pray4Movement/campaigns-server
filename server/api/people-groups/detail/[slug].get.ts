/**
 * GET /api/people-groups/detail/[slug]
 * Get detailed information for a single people group
 * Supports translated labels via ?lang= query param
 */
import { getDatabase } from '../../../database/db'
import { formatPeopleGroupForDetail } from '../../../utils/app/people-group-formatter'
import { setCorsHeaders, setCacheHeaders } from '../../../utils/app/cors'
import { LANGUAGE_CODES } from '../../../../config/languages'

export default defineEventHandler(async (event) => {
  // Set CORS and cache headers
  setCorsHeaders(event)
  setCacheHeaders(event)

  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Slug parameter is required'
    })
  }

  // Parse query params
  const query = getQuery(event)
  const lang = LANGUAGE_CODES.includes(query.lang as string) ? query.lang as string : 'en'

  const db = getDatabase()

  // Query the people group with aggregated people_praying
  const stmt = db.prepare(`
    SELECT
      pg.*,
      COALESCE(SUM(c.people_praying), 0)::INTEGER as total_people_praying
    FROM people_groups pg
    LEFT JOIN campaigns c ON c.dt_id = pg.dt_id
    WHERE pg.slug = ?
    GROUP BY pg.id
  `)

  const peopleGroup = await stmt.get(slug) as any

  if (!peopleGroup) {
    throw createError({
      statusCode: 404,
      statusMessage: 'People group not found'
    })
  }

  return formatPeopleGroupForDetail(peopleGroup, lang)
})
