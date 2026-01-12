import { libraryContentService } from '#server/database/library-content'
import { translateTiptapContent, isDeepLConfigured } from '#server/utils/deepl'
import { getErrorMessage, getIntParam } from '#server/utils/api-helpers'

/**
 * Translate library content to one or more target languages
 *
 * POST /api/admin/libraries/[libraryId]/content/[id]/translate
 *
 * Body:
 * - sourceLanguage: string - Language code to translate FROM
 * - targetLanguages: string[] - Language codes to translate TO
 * - overwrite: boolean - Whether to overwrite existing translations
 *
 * Returns array of created/updated content records
 */
export default defineEventHandler(async (event) => {
  await requirePermission(event, 'content.create')

  const libraryId = getIntParam(event, 'libraryId')
  const contentId = getIntParam(event, 'id')

  // Check if DeepL is configured
  if (!isDeepLConfigured()) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Translation service not configured. Please add DEEPL_API_KEY to environment.'
    })
  }

  const body = await readBody(event)

  // Validate required fields
  if (!body.sourceLanguage) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Source language is required'
    })
  }

  if (!body.targetLanguages || !Array.isArray(body.targetLanguages) || body.targetLanguages.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'At least one target language is required'
    })
  }

  const { sourceLanguage, targetLanguages, overwrite = false } = body

  // Get the source content
  const sourceContent = await libraryContentService.getLibraryContentById(contentId)

  if (!sourceContent) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Source content not found'
    })
  }

  // Verify it belongs to the library
  if (sourceContent.library_id !== libraryId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Content does not belong to this library'
    })
  }

  // Verify source language matches
  if (sourceContent.language_code !== sourceLanguage) {
    throw createError({
      statusCode: 400,
      statusMessage: `Source content is in ${sourceContent.language_code}, not ${sourceLanguage}`
    })
  }

  // Verify content exists
  if (!sourceContent.content_json) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Source content is empty'
    })
  }

  const results: Array<{
    language: string
    success: boolean
    content?: any
    error?: string
    skipped?: boolean
  }> = []

  // Process each target language
  for (const targetLanguage of targetLanguages) {
    // Skip if target is same as source
    if (targetLanguage === sourceLanguage) {
      results.push({
        language: targetLanguage,
        success: false,
        error: 'Cannot translate to source language',
        skipped: true
      })
      continue
    }

    try {
      // Check if content already exists for this language
      const existingContent = await libraryContentService.getLibraryContentByDay(
        libraryId,
        sourceContent.day_number,
        targetLanguage
      )

      if (existingContent && !overwrite) {
        results.push({
          language: targetLanguage,
          success: true,
          skipped: true,
          content: existingContent
        })
        continue
      }

      // Translate the content (cast to expected type since we validated it exists)
      const translatedJson = await translateTiptapContent(
        sourceContent.content_json as Parameters<typeof translateTiptapContent>[0],
        targetLanguage,
        sourceLanguage
      )

      let savedContent
      if (existingContent) {
        // Update existing content
        savedContent = await libraryContentService.updateLibraryContent(existingContent.id, {
          content_json: translatedJson
        })
      } else {
        // Create new content
        savedContent = await libraryContentService.createLibraryContent({
          library_id: libraryId,
          day_number: sourceContent.day_number,
          language_code: targetLanguage,
          content_json: translatedJson
        })
      }

      results.push({
        language: targetLanguage,
        success: true,
        content: savedContent
      })
    } catch (error) {
      results.push({
        language: targetLanguage,
        success: false,
        error: getErrorMessage(error)
      })
    }
  }

  const successCount = results.filter(r => r.success && !r.skipped).length
  const skippedCount = results.filter(r => r.skipped).length
  const failedCount = results.filter(r => !r.success).length

  return {
    success: failedCount === 0,
    message: `Translated ${successCount} language(s), skipped ${skippedCount}, failed ${failedCount}`,
    results
  }
})
