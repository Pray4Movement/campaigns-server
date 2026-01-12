import { libraryService } from '#server/database/libraries'
import { prayerContentService } from '#server/database/prayer-content'
import { handleApiError } from '#server/utils/api-helpers'

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

  const body = await readBody(event)

  try {
    const library = await libraryService.updateLibrary(id, {
      name: body.name,
      description: body.description,
      repeating: body.repeating
    })

    if (!library) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Library not found'
      })
    }

    // Clear cached library stats so changes take effect immediately
    prayerContentService.clearLibraryCache(id)

    return {
      success: true,
      library
    }
  } catch (error) {
    handleApiError(error, 'Failed to update library', 400)
  }
})
