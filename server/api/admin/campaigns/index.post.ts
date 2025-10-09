import { campaignService } from '#server/database/campaigns'
import { requireAuth } from '#server/utils/auth'

export default defineEventHandler(async (event) => {
  // Require authentication
  requireAuth(event)

  const body = await readBody(event)

  // Validate required fields
  if (!body.title) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Title is required'
    })
  }

  try {
    const campaign = await campaignService.createCampaign({
      title: body.title,
      description: body.description,
      slug: body.slug,
      status: body.status || 'active'
    })

    return {
      success: true,
      campaign
    }
  } catch (error: any) {
    throw createError({
      statusCode: 400,
      statusMessage: error.message || 'Failed to create campaign'
    })
  }
})
