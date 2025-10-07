import { campaignService } from '../../../database/campaigns'
import { requireAuth } from '../../../utils/auth'

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
