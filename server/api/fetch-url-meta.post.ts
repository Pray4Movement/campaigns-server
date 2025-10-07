import { requireAuth } from '../utils/auth'

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
    let targetUrl: URL
    try {
      targetUrl = new URL(url)
    } catch {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid URL'
      })
    }

    // Fetch the URL
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PrayerToolsBot/1.0)'
      }
    })

    if (!response.ok) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Failed to fetch URL'
      })
    }

    const html = await response.text()

    // Extract meta tags (basic implementation)
    const titleMatch = html.match(/<title>(.*?)<\/title>/i)
    const descriptionMatch = html.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i)
    const imageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["'](.*?)["']/i)

    // Return metadata in Editor.js Link Tool format
    return {
      success: 1,
      meta: {
        title: titleMatch?.[1] || targetUrl.hostname,
        description: descriptionMatch?.[1] || '',
        image: {
          url: imageMatch?.[1] || ''
        }
      }
    }
  } catch (error: any) {
    console.error('Fetch URL meta error:', error)

    return {
      success: 0,
      error: error.statusMessage || 'Failed to fetch URL metadata'
    }
  }
})
