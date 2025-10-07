import { campaignService } from '../../../database/campaigns'
import { requireAuth } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  // Require authentication
  requireAuth(event)

  const campaignId = parseInt(event.context.params?.campaignId || '0')

  if (!campaignId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid campaign ID'
    })
  }

  const body = await readBody(event)

  try {
    const campaign = campaignService.updateCampaign(campaignId, {
      title: body.title,
      description: body.description,
      slug: body.slug,
      status: body.status
    })

    if (!campaign) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Campaign not found'
      })
    }

    return {
      success: true,
      campaign
    }
  } catch (error: any) {
    throw createError({
      statusCode: 400,
      statusMessage: error.message || 'Failed to update campaign'
    })
  }
})
