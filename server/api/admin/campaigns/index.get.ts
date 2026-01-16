import { campaignService } from '#server/database/campaigns'

export default defineEventHandler(async (event) => {
  // Require campaigns.view permission
  const user = await requirePermission(event, 'campaigns.view')

  const query = getQuery(event)
  const status = query.status as 'active' | 'inactive' | undefined

  // Get campaigns based on user's role and access
  // Admins see all campaigns, campaign editors see only assigned campaigns
  const campaigns = await campaignService.getCampaignsForUser(user.userId, status)

  return {
    campaigns,
    count: campaigns.length
  }
})
