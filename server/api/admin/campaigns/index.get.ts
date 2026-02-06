import { campaignService } from '#server/database/campaigns'
import { campaignSubscriptionService } from '#server/database/campaign-subscriptions'

export default defineEventHandler(async (event) => {
  // Require campaigns.view permission
  const user = await requirePermission(event, 'campaigns.view')

  const query = getQuery(event)
  const status = query.status as 'active' | 'inactive' | undefined

  // Get campaigns based on user's role and access
  // Admins see all campaigns, campaign editors see only assigned campaigns
  const campaigns = await campaignService.getCampaignsForUser(user.userId, status)

  // Enrich campaigns with commitment stats
  const campaignIds = campaigns.map(c => c.id)
  const commitmentStats = await campaignSubscriptionService.getCommitmentStatsForCampaigns(campaignIds)

  const enrichedCampaigns = campaigns.map(campaign => {
    const stats = commitmentStats.get(campaign.id) || { people_committed: 0, committed_duration: 0 }
    return {
      ...campaign,
      people_committed: stats.people_committed,
      committed_duration: stats.committed_duration
    }
  })

  return {
    campaigns: enrichedCampaigns,
    count: enrichedCampaigns.length
  }
})
