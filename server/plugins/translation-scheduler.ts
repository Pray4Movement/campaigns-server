import { translationJobsService } from '../database/translation-jobs'
import { libraryContentService } from '../database/library-content'
import { translateTiptapContent, isDeepLConfigured } from '../utils/deepl'

/**
 * Nitro plugin to process translation job queue
 *
 * This plugin runs when the server starts and checks every 10 seconds
 * for queued translation jobs to process.
 */
export default defineNitroPlugin((nitroApp) => {
  const enableTranslation = process.env.ENABLE_TRANSLATION_PROCESSING !== 'false'

  if (!enableTranslation) {
    console.log('Translation processing disabled')
    console.log('   Set ENABLE_TRANSLATION_PROCESSING=true to enable')
    return
  }

  console.log('Translation processor started (checking every 10 seconds)')

  let isProcessing = false

  const interval = setInterval(async () => {
    if (isProcessing) {
      return
    }

    isProcessing = true

    try {
      await processTranslationQueue()
    } catch (error: any) {
      console.error('Translation processor error:', error.message)
    } finally {
      isProcessing = false
    }
  }, 10 * 1000) // 10 seconds

  // Initial check after startup
  setTimeout(async () => {
    if (!isProcessing) {
      isProcessing = true
      try {
        await processTranslationQueue()
      } catch (error: any) {
        console.error('Initial translation check error:', error.message)
      } finally {
        isProcessing = false
      }
    }
  }, 20000) // 20 seconds after startup

  console.log('Translation processor initialized')

  nitroApp.hooks.hook('close', () => {
    console.log('Stopping translation processor...')
    clearInterval(interval)
  })
})

async function processTranslationQueue() {
  // Check if DeepL is configured
  if (!isDeepLConfigured()) {
    return
  }

  // Get one pending job at a time to respect rate limits
  const pendingJobs = await translationJobsService.getPendingJobs(1)

  if (pendingJobs.length === 0) {
    return
  }

  const job = pendingJobs[0]

  console.log(`Processing translation job ${job.id} (${job.target_language})...`)

  try {
    await translationJobsService.markProcessing(job.id)

    // Get source content
    const sourceContent = await libraryContentService.getLibraryContentById(job.source_content_id)

    if (!sourceContent) {
      await translationJobsService.markFailed(job.id, 'Source content not found')
      console.error(`  Job ${job.id} failed: Source content not found`)
      return
    }

    if (!sourceContent.content_json) {
      await translationJobsService.markFailed(job.id, 'Source content is empty')
      console.error(`  Job ${job.id} failed: Source content is empty`)
      return
    }

    // Check if target already exists (race condition protection)
    const existingTarget = await libraryContentService.getLibraryContentByDay(
      job.library_id,
      sourceContent.day_number,
      job.target_language
    )

    if (existingTarget && !job.overwrite) {
      // Already exists and not overwriting - mark as completed
      await translationJobsService.markCompleted(job.id)
      console.log(`  Job ${job.id} skipped: Target already exists`)
      return
    }

    // Perform translation
    const translatedJson = await translateTiptapContent(
      sourceContent.content_json,
      job.target_language,
      sourceContent.language_code
    )

    // Save translated content
    if (existingTarget) {
      // Update existing
      await libraryContentService.updateLibraryContent(existingTarget.id, {
        content_json: translatedJson
      })
    } else {
      // Create new
      await libraryContentService.createLibraryContent({
        library_id: job.library_id,
        day_number: sourceContent.day_number,
        language_code: job.target_language,
        content_json: translatedJson
      })
    }

    await translationJobsService.markCompleted(job.id)
    console.log(`  Job ${job.id} completed: Translated to ${job.target_language}`)
  } catch (error: any) {
    const errorMessage = error.message || 'Unknown error'

    // Check if this was the 3rd attempt
    if (job.attempts >= 2) {
      await translationJobsService.markFailed(job.id, `Failed after 3 attempts: ${errorMessage}`)
      console.error(`  Job ${job.id} failed permanently: ${errorMessage}`)
    } else {
      // Reset to pending for retry (markProcessing already incremented attempts)
      await translationJobsService.markFailed(job.id, errorMessage)
      console.error(`  Job ${job.id} failed (attempt ${job.attempts + 1}): ${errorMessage}`)
    }
  }
}
