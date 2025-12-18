import { libraryService } from '#server/database/libraries'

export default defineEventHandler(async (event) => {
  // Require admin authentication
  await requireAdmin(event)

  const id = parseInt(event.context.params?.libraryId || '0')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid library ID'
    })
  }

  // Check if the library exists and is not a people_group library
  const library = await libraryService.getLibraryById(id)
  if (!library) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Library not found'
    })
  }

  if (library.type === 'people_group') {
    throw createError({
      statusCode: 403,
      statusMessage: 'The People Group library cannot be deleted'
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
