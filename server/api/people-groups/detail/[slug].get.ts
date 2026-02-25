/**
 * GET /api/people-groups/detail/[slug]
 * Get detailed information for a single people group
 * Supports translated labels via ?locale= query param
 */
import { getDatabase } from '../../../database/db'
import { formatPeopleGroupForDetail } from '../../../utils/app/people-group-formatter'
import { setCorsHeaders, setCacheHeaders } from '../../../utils/app/cors'
import { LANGUAGE_CODES } from '../../../../config/languages'
import { peopleGroupSubscriptionService } from '#server/database/people-group-subscriptions'
import { appConfigService } from '#server/database/app-config'

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

  // Parse query params - support both 'locale' and legacy 'lang', with Accept-Language fallback
  const query = getQuery(event)
  const acceptLanguage = getHeader(event, 'accept-language')
  const rawLocale = (query.locale as string) || (query.lang as string) || acceptLanguage?.split(',')[0]?.split('-')[0] || 'en'
  const lang = LANGUAGE_CODES.includes(rawLocale) ? rawLocale : 'en'

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

  // Get commitment stats and global start date
  const [commitmentStats, globalStartDate] = await Promise.all([
    peopleGroupSubscriptionService.getCommitmentStats(peopleGroup.id),
    appConfigService.getConfig<string>('global_campaign_start_date')
  ])

  return {
    ...formatPeopleGroupForDetail(peopleGroup, lang),
    people_committed: commitmentStats.people_committed,
    committed_duration: commitmentStats.committed_duration,
    global_start_date: globalStartDate
  }
})
