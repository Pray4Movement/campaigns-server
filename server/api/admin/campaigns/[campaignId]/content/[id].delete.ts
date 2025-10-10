import { prayerContentService } from '#server/database/prayer-content'
import { campaignService } from '#server/database/campaigns'
import { requireAuth } from '#server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)

  const id = parseInt(event.context.params?.id || '0')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid content ID'
    })
  }

  // Get existing content to check campaign access
  const existingContent = await prayerContentService.getPrayerContentById(id)
  if (!existingContent) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Content not found'
    })
  }

  // Check if user has access to this content's campaign
  const hasAccess = await campaignService.userCanAccessCampaign(user.userId, existingContent.campaign_id)
  if (!hasAccess) {
    throw createError({
      statusCode: 403,
      statusMessage: 'You do not have access to this campaign'
    })
  }

  const success = await prayerContentService.deletePrayerContent(id)

  if (!success) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Content not found'
    })
  }

  return {
    success: true,
    message: 'Content deleted successfully'
  }
})
