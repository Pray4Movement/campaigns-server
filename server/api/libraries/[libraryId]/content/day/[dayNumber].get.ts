import { libraryContentService } from '#server/database/library-content'
import { getIntParam } from '#server/utils/api-helpers'

export default defineEventHandler(async (event) => {
  const libraryId = getIntParam(event, 'libraryId')
  const dayNumber = getIntParam(event, 'dayNumber')

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
