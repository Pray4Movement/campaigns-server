import { libraryContentService } from '#server/database/library-content'

export default defineEventHandler(async (event) => {
  // Require authentication
  await requireAuth(event)

  const libraryId = parseInt(event.context.params?.libraryId || '0')
  const dayNumber = parseInt(event.context.params?.dayNumber || '0')

  if (!libraryId || !dayNumber) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid library ID or day number'
    })
  }

  // Get all content for this day in all languages
  const content = await libraryContentService.getLibraryContent(libraryId, {
    startDay: dayNumber,
    endDay: dayNumber
  })

  return {
    dayNumber,
    content
  }
})
