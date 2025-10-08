import { prayerContentService } from '#server/database/prayer-content'
import { requireAuth } from '#server/utils/auth'

export default defineEventHandler((event) => {
  requireAuth(event)

  const id = parseInt(event.context.params?.id || '0')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid content ID'
    })
  }

  const content = prayerContentService.getPrayerContentById(id)

  if (!content) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Content not found'
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
