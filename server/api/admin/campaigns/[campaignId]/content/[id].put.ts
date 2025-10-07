import { prayerContentService } from '../../../../../database/prayer-content'
import { requireAuth } from '../../../../../utils/auth'

export default defineEventHandler(async (event) => {
  requireAuth(event)

  const id = parseInt(event.context.params?.id || '0')
  const body = await readBody(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid content ID'
    })
  }

  try {
    const content = prayerContentService.updatePrayerContent(id, {
      title: body.title,
      body_text: body.body_text,
      content_json: body.content_json,
      scripture_references: body.scripture_references,
      prayer_prompts: body.prayer_prompts,
      content_date: body.content_date
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
    throw createError({
      statusCode: 400,
      statusMessage: error.message || 'Failed to update content'
    })
  }
})
