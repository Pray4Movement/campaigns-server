import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { requireAuth } from '#server/utils/auth'

export default defineEventHandler(async (event) => {
  // Require authentication
  requireAuth(event)

  try {
    const body = await readBody(event)
    const { url } = body

    if (!url) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No URL provided'
      })
    }

    // Validate URL
    let imageUrl: URL
    try {
      imageUrl = new URL(url)
    } catch {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid URL'
      })
    }

    // Fetch the image
    const response = await fetch(url)

    if (!response.ok) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Failed to fetch image from URL'
      })
    }

    // Validate content type
    const contentType = response.headers.get('content-type')
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']

    if (!contentType || !allowedTypes.some(type => contentType.includes(type))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'URL does not point to a valid image'
      })
    }

    // Get image data
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'images')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const extension = contentType.split('/')[1] || 'jpg'
    const filename = `${timestamp}-${Math.random().toString(36).substring(7)}.${extension}`
    const filepath = join(uploadsDir, filename)

    // Save file
    await writeFile(filepath, buffer)

    // Return URL in Editor.js format
    return {
      success: 1,
      file: {
        url: `/uploads/images/${filename}`
      }
    }
  } catch (error: any) {
    console.error('Upload by URL error:', error)

    return {
      success: 0,
      error: error.statusMessage || 'Failed to upload image from URL'
    }
  }
})
