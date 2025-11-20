import { libraryContentService } from '#server/database/library-content'

export default defineEventHandler(async (event) => {
  // Require content.create permission
  await requirePermission(event, 'content.create')

  const libraryId = parseInt(event.context.params?.libraryId || '0')

  if (!libraryId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid library ID'
    })
  }

  const body = await readBody(event)

  // Validate required fields
  if (!body.day_number || !body.language_code) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Day number and language code are required'
    })
  }

  try {
    const content = await libraryContentService.createLibraryContent({
      library_id: libraryId,
      day_number: body.day_number,
      language_code: body.language_code,
      content_json: body.content_json
    })

    return {
      success: true,
      content
    }
  } catch (error: any) {
    throw createError({
      statusCode: 400,
      statusMessage: error.message || 'Failed to create library content'
    })
  }
})
