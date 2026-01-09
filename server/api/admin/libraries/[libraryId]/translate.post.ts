import { libraryContentService } from '#server/database/library-content'
import { jobQueueService, type TranslationPayload } from '#server/database/job-queue'
import { isDeepLConfigured } from '#server/utils/deepl'

// All supported language codes
const ALL_LANGUAGES = ['en', 'es', 'fr', 'pt', 'de', 'it', 'zh', 'ar', 'ru', 'hi']

/**
 * Queue bulk translation for an entire library
 *
 * POST /api/admin/libraries/[libraryId]/translate
 *
 * Body:
 * - sourceLanguage: string - Language code to translate FROM
 * - overwrite: boolean - Whether to overwrite existing translations
 *
 * Returns library ID for tracking progress via reference_type='library_translation'
 */
export default defineEventHandler(async (event) => {
  await requirePermission(event, 'content.create')

  const libraryId = parseInt(event.context.params?.libraryId || '0')

  if (!libraryId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid library ID'
    })
  }

  // Check if DeepL is configured
  if (!isDeepLConfigured()) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Translation service not configured. Please add DEEPL_API_KEY to environment.'
    })
  }

  const body = await readBody(event)

  if (!body.sourceLanguage) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Source language is required'
    })
  }

  const { sourceLanguage, overwrite = false } = body

  // Get all content for the source language in this library
  const sourceContent = await libraryContentService.getLibraryContent(libraryId, {
    language: sourceLanguage
  })

  if (sourceContent.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: `No content found for language: ${sourceLanguage}`
    })
  }

  // Determine target languages (all except source)
  const targetLanguages = ALL_LANGUAGES.filter(lang => lang !== sourceLanguage)

  // Create jobs for each source content × target language combination
  let jobCount = 0

  for (const content of sourceContent) {
    // Skip content without actual content
    if (!content.content_json) continue

    for (const targetLanguage of targetLanguages) {
      // If not overwriting, check if target already exists
      if (!overwrite) {
        const existing = await libraryContentService.getLibraryContentByDay(
          libraryId,
          content.day_number,
          targetLanguage
        )
        if (existing) continue
      }

      const payload: TranslationPayload = {
        library_id: libraryId,
        source_content_id: content.id,
        source_language: sourceLanguage,
        target_language: targetLanguage,
        overwrite
      }

      await jobQueueService.createJob('translation', payload, {
        referenceType: 'library_translation',
        referenceId: libraryId
      })
      jobCount++
    }
  }

  if (jobCount === 0) {
    return {
      success: true,
      message: 'No translations needed - all target languages already have content',
      libraryId,
      totalJobs: 0
    }
  }

  return {
    success: true,
    message: `Queued ${jobCount} translation job(s)`,
    libraryId,
    totalJobs: jobCount
  }
})
