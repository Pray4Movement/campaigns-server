/**
 * GET /api/people-groups
 * List all people groups with images
 */
import { peopleGroupService } from '#server/database/people-groups'
import { peopleGroupSubscriptionService } from '#server/database/people-group-subscriptions'
import { generatePeopleGroupDescription } from '../../utils/app/people-group-description'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const acceptLanguage = getHeader(event, 'accept-language')
  const locale = (query.locale as string) || acceptLanguage?.split(',')[0]?.split('-')[0] || 'en'

  const peopleGroups = await peopleGroupService.getAllPeopleGroups()

  // Get commitment stats for all people groups
  const ids = peopleGroups.map(pg => pg.id)
  const commitmentStats = await peopleGroupSubscriptionService.getCommitmentStatsForPeopleGroups(ids)

  const enrichedPeopleGroups = peopleGroups.map((pg) => {
    const stats = commitmentStats.get(pg.id) || { people_committed: 0, committed_duration: 0 }
    const metadata = pg.metadata ? JSON.parse(pg.metadata) : {}
    const descriptions = pg.descriptions ? (typeof pg.descriptions === 'string' ? JSON.parse(pg.descriptions) : pg.descriptions) : null
    const description = generatePeopleGroupDescription({ name: pg.name, descriptions, metadata }, locale)
    return {
      id: pg.id,
      slug: pg.slug,
      title: pg.name,
      dt_id: pg.dt_id,
      people_praying: pg.people_praying,
      daily_prayer_duration: pg.daily_prayer_duration,
      image_url: pg.image_url,
      people_committed: stats.people_committed,
      committed_duration: stats.committed_duration,
      description,
      created_at: pg.created_at,
      updated_at: pg.updated_at
    }
  })

  // Cache for 1 hour at edge (Cloudflare)
  setResponseHeader(event, 'Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=600')

  return {
    peopleGroups: enrichedPeopleGroups
  }
})
