import { prayerContentService } from '#server/database/prayer-content'
import { requireAuth } from '#server/utils/auth'

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
    throw createError({
      statusCode: 400,
      statusMessage: error.message || 'Failed to update content'
    })
  }
})
