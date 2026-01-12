import { libraryContentService } from '#server/database/library-content'
import { getIntParam } from '#server/utils/api-helpers'

export default defineEventHandler(async (event) => {
  // Require authentication
  await requireAuth(event)

  const id = getIntParam(event, 'id')

  const content = await libraryContentService.getLibraryContentById(id)

  if (!content) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Content not found'
    })
  }

  return {
    content
  }
})
