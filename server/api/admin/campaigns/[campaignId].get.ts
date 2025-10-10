import { campaignService } from '#server/database/campaigns'
import { requireAuth } from '#server/utils/auth'

export default defineEventHandler(async (event) => {
  // Require authentication
  const user = requireAuth(event)

  const campaignId = parseInt(event.context.params?.campaignId || '0')

  if (!campaignId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid campaign ID'
    })
  }

  // Check if user has access to this campaign
  const hasAccess = await campaignService.userCanAccessCampaign(user.userId, campaignId)
  if (!hasAccess) {
    throw createError({
      statusCode: 403,
      statusMessage: 'You do not have access to this campaign'
    })
  }

  const campaign = await campaignService.getCampaignById(campaignId)

  if (!campaign) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Campaign not found'
    })
  }

  return {
    campaign
  }
})
