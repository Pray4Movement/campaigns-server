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

  const success = prayerContentService.deletePrayerContent(id)

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
