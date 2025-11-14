import { campaignAccessService } from '#server/database/campaign-access'
import { campaignService } from '#server/database/campaigns'

export default defineEventHandler(async (event) => {
  // Require admin authentication
  await requireAdmin(event)

  // Get user ID from route params
  const userId = parseInt(getRouterParam(event, 'id') || '0')
  if (!userId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid user ID'
    })
  }

  try {
    // Get campaign IDs the user has access to
    const campaignIds = await campaignAccessService.getUserCampaigns(userId)

    // Get all campaigns
    const allCampaigns = await campaignService.getAllCampaigns()

    // Return campaigns with access flag
    const campaignsWithAccess = allCampaigns.map(campaign => ({
      ...campaign,
      hasAccess: campaignIds.includes(campaign.id)
    }))

    return {
      success: true,
      campaigns: campaignsWithAccess
    }
  } catch (error: any) {
    console.error('Error fetching user campaigns:', error)

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch user campaigns'
    })
  }
})
