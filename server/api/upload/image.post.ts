import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export default defineEventHandler(async (event) => {
  // Require authentication
  requireAuth(event)

  try {
    // Get the form data
    const formData = await readMultipartFormData(event)

    if (!formData || formData.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No file uploaded'
      })
    }

    // Get the file from form data
    const file = formData.find(item => item.name === 'image')

    if (!file) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No image file found'
      })
    }

    // Validate file type and get safe extension from MIME type
    const mimeToExtension: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp'
    }
    const extension = mimeToExtension[file.type || '']
    if (!extension) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'
      })
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'images')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique filename using safe extension derived from MIME type
    const timestamp = Date.now()
    const filename = `${timestamp}-${Math.random().toString(36).substring(7)}.${extension}`
    const filepath = join(uploadsDir, filename)

    // Save file
    await writeFile(filepath, file.data)

    // Return URL in Editor.js format
    return {
      success: 1,
      file: {
        url: `/uploads/images/${filename}`
      }
    }
  } catch (error: any) {
    console.error('Upload error:', error)

    // Re-throw HTTP errors (from createError) - don't swallow validation errors
    if (error.statusCode) {
      throw error
    }

    // For unexpected errors, throw 500
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to upload image'
    })
  }
})
