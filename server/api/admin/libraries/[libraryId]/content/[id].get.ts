import { libraryContentService } from '#server/database/library-content'

export default defineEventHandler(async (event) => {
  // Require authentication
  await requireAuth(event)

  const id = parseInt(event.context.params?.id || '0')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid content ID'
    })
  }

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
