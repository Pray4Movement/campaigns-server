import { libraryService } from '#server/database/libraries'

export default defineEventHandler(async (event) => {
  // Require admin authentication
  await requireAdmin(event)

  const id = parseInt(event.context.params?.id || '0')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid library ID'
    })
  }

  try {
    const success = await libraryService.deleteLibrary(id)

    if (!success) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Library not found'
      })
    }

    return {
      success: true
    }
  } catch (error: any) {
    throw createError({
      statusCode: 400,
      statusMessage: error.message || 'Failed to delete library'
    })
  }
})
