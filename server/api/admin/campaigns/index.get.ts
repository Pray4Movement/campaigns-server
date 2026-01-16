import { campaignService } from '#server/database/campaigns'

export default defineEventHandler(async (event) => {
  const start = Date.now()

  // Require campaigns.view permission
  const user = await requirePermission(event, 'campaigns.view')
  const t1 = Date.now()

  const query = getQuery(event)
  const status = query.status as 'active' | 'inactive' | undefined

  // Get campaigns based on user's role and access
  // Admins see all campaigns, campaign editors see only assigned campaigns
  const campaigns = await campaignService.getCampaignsForUser(user.userId, status)
  const t2 = Date.now()

  console.log(`[timing] auth: ${t1 - start}ms, db: ${t2 - t1}ms, total: ${t2 - start}ms`)

  return {
    campaigns,
    count: campaigns.length
  }
})
