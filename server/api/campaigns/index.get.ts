/**
 * GET /api/campaigns
 * List all active campaigns with people group images
 */
import { campaignService } from '#server/database/campaigns'
import { campaignSubscriptionService } from '#server/database/campaign-subscriptions'
import { peopleGroupService } from '#server/database/people-groups'

export default defineEventHandler(async (event) => {
  // Only return active campaigns to the public
  const campaigns = await campaignService.getAllCampaigns('active')

  // Get commitment stats for all campaigns
  const campaignIds = campaigns.map(c => c.id)
  const commitmentStats = await campaignSubscriptionService.getCommitmentStatsForCampaigns(campaignIds)

  // Enrich campaigns with people group image URLs and commitment stats
  const enrichedCampaigns = await Promise.all(
    campaigns.map(async (campaign) => {
      let image_url = null
      if (campaign.dt_id) {
        const pg = await peopleGroupService.getPeopleGroupByDtId(campaign.dt_id)
        image_url = pg?.image_url || null
      }
      const stats = commitmentStats.get(campaign.id) || { people_committed: 0, committed_duration: 0 }
      return {
        ...campaign,
        image_url,
        people_committed: stats.people_committed,
        committed_duration: stats.committed_duration
      }
    })
  )

  // Cache for 1 hour at edge (Cloudflare)
  setResponseHeader(event, 'Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=600')

  return {
    campaigns: enrichedCampaigns
  }
})
