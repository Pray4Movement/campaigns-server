import { campaignService } from '#server/database/campaigns'

export default defineEventHandler(async (event) => {
  // Require campaigns.edit permission
  const user = await requirePermission(event, 'campaigns.edit')

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

  const body = await readBody(event)

  try {
    const campaign = await campaignService.updateCampaign(campaignId, {
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
