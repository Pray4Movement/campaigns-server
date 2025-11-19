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

  try {
    const success = await libraryContentService.deleteLibraryContent(id)

    if (!success) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Content not found'
      })
    }

    return {
      success: true
    }
  } catch (error: any) {
    throw createError({
      statusCode: 400,
      statusMessage: error.message || 'Failed to delete content'
    })
  }
})
