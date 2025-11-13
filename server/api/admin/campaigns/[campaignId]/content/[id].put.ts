import { prayerContentService } from '#server/database/prayer-content'
import { campaignService } from '#server/database/campaigns'
import { requireAuth } from '#server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)

  const id = parseInt(event.context.params?.id || '0')
  const body = await readBody(event)

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

  try {
    const content = await prayerContentService.updatePrayerContent(id, {
      title: body.title,
      content_json: body.content_json,
      content_date: body.content_date,
      language_code: body.language_code
    })

    if (!content) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Content not found'
      })
    }

    return {
      success: true,
      content
    }
  } catch (error: any) {
    // Check for unique constraint violation
    if (error.code === '23505' || error.message?.includes('unique constraint')) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Content already exists for this campaign, date, and language combination'
      })
    }

    throw createError({
      statusCode: 400,
      statusMessage: error.message || 'Failed to update content'
    })
  }
})
