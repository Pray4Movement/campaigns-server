import type { Job, TranslationPayload } from '../../database/job-queue'
import type { ProcessorResult } from './index'
import { libraryContentService } from '../../database/library-content'
import { translateTiptapContent, isDeepLConfigured } from '../../utils/deepl'

export async function processTranslation(job: Job): Promise<ProcessorResult> {
  const payload = job.payload as TranslationPayload

  // Check if DeepL is configured
  if (!isDeepLConfigured()) {
    return { success: false, data: { error: 'DeepL API key not configured' } }
  }

  // Get source content
  const sourceContent = await libraryContentService.getLibraryContentById(payload.source_content_id)

  if (!sourceContent) {
    return { success: false, data: { error: 'Source content not found' } }
  }

  if (!sourceContent.content_json) {
    return { success: false, data: { error: 'Source content is empty' } }
  }

  // Check if target already exists (race condition protection)
  const existingTarget = await libraryContentService.getLibraryContentByDay(
    payload.library_id,
    sourceContent.day_number,
    payload.target_language
  )

  if (existingTarget && !payload.overwrite) {
    // Already exists and not overwriting - mark as completed (skipped)
    console.log(`  Translation job ${job.id} skipped: Target already exists for day ${sourceContent.day_number} ${payload.target_language}`)
    return { success: true, data: { skipped: true, reason: 'Target already exists' } }
  }

  // Perform translation
  const translatedJson = await translateTiptapContent(
    sourceContent.content_json,
    payload.target_language,
    payload.source_language
  )

  // Save translated content
  if (existingTarget) {
    // Update existing
    await libraryContentService.updateLibraryContent(existingTarget.id, {
      content_json: translatedJson
    })
    console.log(`  Translation job ${job.id} completed: Updated day ${sourceContent.day_number} ${payload.target_language}`)
  } else {
    // Create new
    await libraryContentService.createLibraryContent({
      library_id: payload.library_id,
      day_number: sourceContent.day_number,
      language_code: payload.target_language,
      content_json: translatedJson
    })
    console.log(`  Translation job ${job.id} completed: Created day ${sourceContent.day_number} ${payload.target_language}`)
  }

  return {
    success: true,
    data: {
      day_number: sourceContent.day_number,
      target_language: payload.target_language,
      updated: !!existingTarget
    }
  }
}
