import { libraryContentService } from '#server/database/library-content'
import { translationJobsService } from '#server/database/translation-jobs'
import { isDeepLConfigured } from '#server/utils/deepl'
import { randomUUID } from 'crypto'

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
 * Returns batch ID for tracking progress
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

  // Generate batch ID
  const batchId = randomUUID()

  // Create jobs for each source content × target language combination
  const jobsToCreate: Array<{
    batch_id: string
    library_id: number
    source_content_id: number
    target_language: string
    overwrite: boolean
  }> = []

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

      jobsToCreate.push({
        batch_id: batchId,
        library_id: libraryId,
        source_content_id: content.id,
        target_language: targetLanguage,
        overwrite
      })
    }
  }

  if (jobsToCreate.length === 0) {
    return {
      success: true,
      message: 'No translations needed - all target languages already have content',
      batchId,
      totalJobs: 0
    }
  }

  // Create all jobs
  const jobCount = await translationJobsService.createJobs(jobsToCreate)

  return {
    success: true,
    message: `Queued ${jobCount} translation job(s)`,
    batchId,
    totalJobs: jobCount
  }
})
