import { libraryContentService } from '#server/database/library-content'

export default defineEventHandler(async (event) => {
  const libraryId = parseInt(event.context.params?.libraryId || '0')
  const dayNumber = parseInt(event.context.params?.dayNumber || '0')

  if (!libraryId || !dayNumber) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid library ID or day number'
    })
  }

  const query = getQuery(event)
  const language = query.language as string | undefined

  // Get content for this day
  const content = await libraryContentService.getLibraryContent(libraryId, {
    startDay: dayNumber,
    endDay: dayNumber,
    language
  })

  return {
    dayNumber,
    content
  }
})
