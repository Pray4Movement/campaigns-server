import { campaignService } from '#server/database/campaigns'
import { requireAuth } from '#server/utils/auth'

export default defineEventHandler((event) => {
  // Require authentication
  requireAuth(event)

  const query = getQuery(event)
  const status = query.status as 'active' | 'inactive' | undefined

  const campaigns = campaignService.getAllCampaigns(status)

  return {
    campaigns,
    count: campaigns.length
  }
})
