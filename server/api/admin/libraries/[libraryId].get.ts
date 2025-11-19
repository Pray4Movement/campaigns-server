import { libraryService } from '#server/database/libraries'

export default defineEventHandler(async (event) => {
  // Require authentication
  await requireAuth(event)

  const id = parseInt(event.context.params?.libraryId || '0')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid library ID'
    })
  }

  const library = await libraryService.getLibraryById(id)

  if (!library) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Library not found'
    })
  }

  // Get stats
  const stats = await libraryService.getLibraryStats(id)

  return {
    library: {
      ...library,
      stats
    }
  }
})
