import { libraryService } from '#server/database/libraries'

export default defineEventHandler(async (event) => {
  // Require admin authentication - only admins can create libraries
  await requireAdmin(event)

  const body = await readBody(event)

  // Validate required fields
  if (!body.name) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Library name is required'
    })
  }

  try {
    const library = await libraryService.createLibrary({
      name: body.name,
      description: body.description,
      repeating: body.repeating
    })

    return {
      success: true,
      library
    }
  } catch (error: any) {
    throw createError({
      statusCode: 400,
      statusMessage: error.message || 'Failed to create library'
    })
  }
})
