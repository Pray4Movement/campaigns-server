import { prayerContentService } from '#server/database/prayer-content'
import { campaignService } from '#server/database/campaigns'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)

  const id = parseInt(event.context.params?.id || '0')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid content ID'
    })
  }

  const content = await prayerContentService.getPrayerContentById(id)

  if (!content) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Content not found'
    })
  }

  // Check if user has access to this content's campaign
  const hasAccess = await campaignService.userCanAccessCampaign(user.userId, content.campaign_id)
  if (!hasAccess) {
    throw createError({
      statusCode: 403,
      statusMessage: 'You do not have access to this campaign'
    })
  }

  // Parse content_json if it's a string
  if (typeof content.content_json === 'string') {
    try {
      content.content_json = JSON.parse(content.content_json)
    } catch (e) {
      console.error('Failed to parse content_json:', e)
    }
  }

  return content
})
