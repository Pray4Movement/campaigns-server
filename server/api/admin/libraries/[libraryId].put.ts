import { libraryService } from '#server/database/libraries'
import { prayerContentService } from '#server/database/prayer-content'
import { handleApiError, getIntParam } from '#server/utils/api-helpers'

export default defineEventHandler(async (event) => {
  // Require admin authentication
  await requireAdmin(event)

  const id = getIntParam(event, 'libraryId')

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
