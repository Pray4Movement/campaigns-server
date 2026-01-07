import { subscriberService } from '#server/database/subscribers'
import { roleService } from '#server/database/roles'
import { campaignAccessService } from '#server/database/campaign-access'

export default defineEventHandler(async (event) => {
  const user = await requirePermission(event, 'campaigns.view')

  const query = getQuery(event)
  const search = query.search as string | undefined
  const campaignId = query.campaign_id ? parseInt(query.campaign_id as string) : undefined

  try {
    // Determine accessible campaigns for non-admin users
    const isAdmin = await roleService.isAdmin(user.userId)
    let accessibleCampaignIds: number[] | undefined

    if (!isAdmin) {
      accessibleCampaignIds = await campaignAccessService.getUserCampaigns(user.userId)

      // If user has no campaign access, return empty list
      if (accessibleCampaignIds.length === 0) {
        return { subscribers: [] }
      }

      // If filtering by campaign, verify user has access
      if (campaignId && !accessibleCampaignIds.includes(campaignId)) {
        throw createError({
          statusCode: 403,
          statusMessage: 'You do not have access to this campaign'
        })
      }
    }

    const subscribers = await subscriberService.getAllSubscribersWithSubscriptions({
      search,
      campaignId,
      accessibleCampaignIds
    })

    return {
      subscribers
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Error fetching subscribers:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch subscribers'
    })
  }
})
