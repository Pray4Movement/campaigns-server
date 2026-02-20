/**
 * GET /api/people-groups
 * List all people groups (campaigns) with images
 */
import { peopleGroupService } from '#server/database/people-groups'
import { campaignSubscriptionService } from '#server/database/campaign-subscriptions'

export default defineEventHandler(async (event) => {
  const peopleGroups = await peopleGroupService.getAllPeopleGroups()

  // Get commitment stats for all people groups
  const ids = peopleGroups.map(pg => pg.id)
  const commitmentStats = await campaignSubscriptionService.getCommitmentStatsForCampaigns(ids)

  const enrichedCampaigns = peopleGroups.map((pg) => {
    const stats = commitmentStats.get(pg.id) || { people_committed: 0, committed_duration: 0 }
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
      created_at: pg.created_at,
      updated_at: pg.updated_at
    }
  })

  // Cache for 1 hour at edge (Cloudflare)
  setResponseHeader(event, 'Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=600')

  return {
    peopleGroups: enrichedCampaigns
  }
})
