import { prayerContentService } from '../../../../../database/prayer-content'
import { requireAuth } from '../../../../../utils/auth'

export default defineEventHandler(async (event) => {
  requireAuth(event)

  const campaignId = parseInt(event.context.params?.campaignId || '0')
  const body = await readBody(event)

  if (!campaignId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid campaign ID'
    })
  }

  if (!body.title || !body.content_date) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Title and content date are required'
    })
  }

  try {
    const content = prayerContentService.createPrayerContent({
      campaign_id: campaignId,
      content_date: body.content_date,
      title: body.title,
      body_text: body.body_text,
      content_json: body.content_json,
      scripture_references: body.scripture_references,
      prayer_prompts: body.prayer_prompts,
      media: body.media
    })

    return {
      success: true,
      content
    }
  } catch (error: any) {
    throw createError({
      statusCode: 400,
      statusMessage: error.message || 'Failed to create content'
    })
  }
})
