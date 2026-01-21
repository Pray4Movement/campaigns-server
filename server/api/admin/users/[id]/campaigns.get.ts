import { campaignAccessService } from '#server/database/campaign-access'
import { campaignService } from '#server/database/campaigns'
import { handleApiError, getUuidParam } from '#server/utils/api-helpers'

export default defineEventHandler(async (event) => {
  // Require admin authentication
  await requireAdmin(event)

  // Get and validate user ID from route params (UUID string)
  const userId = getUuidParam(event, 'id')

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
  } catch (error) {
    handleApiError(error, 'Failed to fetch user campaigns')
  }
})
