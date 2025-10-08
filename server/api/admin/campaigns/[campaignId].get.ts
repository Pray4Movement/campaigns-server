import { campaignService } from '../../../database/campaigns'
import { requireAuth } from '../../../utils/auth'

export default defineEventHandler((event) => {
  // Require authentication
  requireAuth(event)

  const campaignId = parseInt(event.context.params?.campaignId || '0')

  if (!campaignId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid campaign ID'
    })
  }

  const campaign = campaignService.getCampaignById(campaignId)

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
