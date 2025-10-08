import { requireAuth } from '#server/utils/auth'
import { uploadMedia, validateImageFile, validateVideoFile } from '#server/utils/media'

export default defineEventHandler(async (event) => {
  // Require authentication
  requireAuth(event)

  const formData = await readFormData(event)
  const file = formData.get('file') as File

  if (!file) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No file provided'
    })
  }

  // Validate file type
  const mediaType = formData.get('type') as string
  let validation

  if (mediaType === 'image') {
    validation = validateImageFile(file)
  } else if (mediaType === 'video') {
    validation = validateVideoFile(file)
  } else {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid media type. Must be "image" or "video"'
    })
  }

  if (!validation.valid) {
    throw createError({
      statusCode: 400,
      statusMessage: validation.error || 'File validation failed'
    })
  }

  try {
    const uploadedFile = await uploadMedia(file)

    return {
      success: true,
      file: uploadedFile
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to upload file'
    })
  }
})
