import { libraryContentService } from '#server/database/library-content'
import { handleApiError } from '#server/utils/api-helpers'

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

  const body = await readBody(event)

  try {
    const content = await libraryContentService.updateLibraryContent(id, {
      content_json: body.content_json,
      day_number: body.day_number,
      language_code: body.language_code
    })

    if (!content) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Content not found'
      })
    }

    return {
      success: true,
      content
    }
  } catch (error) {
    handleApiError(error, 'Failed to update content', 400)
  }
})
