import type { Job, TranslationBatchPayload } from '../../database/job-queue'
import type { ProcessorResult } from './index'
import { libraryContentService } from '../../database/library-content'
import { batchTranslateTiptapContents, isDeepLConfigured } from '../../utils/deepl'

export async function processBatchTranslation(job: Job): Promise<ProcessorResult> {
  const payload = job.payload as TranslationBatchPayload

  if (!isDeepLConfigured()) {
    return { success: false, data: { error: 'DeepL API key not configured' } }
  }

  // Get all source content for this library + language
  const sourceContent = await libraryContentService.getLibraryContent(payload.library_id, {
    language: payload.source_language
  })

  if (sourceContent.length === 0) {
    return { success: false, data: { error: 'No source content found' } }
  }

  // Filter to items that have content
  let contentToTranslate = sourceContent.filter(c => c.content_json)

  // If not overwriting, filter out days that already have target translations
  if (!payload.overwrite) {
    const existingTarget = await libraryContentService.getLibraryContent(payload.library_id, {
      language: payload.target_language
    })
    const existingDays = new Set(existingTarget.map(c => c.day_number))
    contentToTranslate = contentToTranslate.filter(c => !existingDays.has(c.day_number))
  }

  if (contentToTranslate.length === 0) {
    return { success: true, data: { skipped: true, reason: 'All days already translated', target_language: payload.target_language } }
  }

  // Batch translate all docs at once
  const docs = contentToTranslate.map(c => c.content_json!)
  const translatedDocs = await batchTranslateTiptapContents(docs, payload.target_language, payload.source_language)

  // Bulk upsert all translated content
  const items = contentToTranslate.map((c, i) => ({
    day_number: c.day_number,
    language_code: payload.target_language,
    content_json: translatedDocs[i]!
  }))

  const { upserted } = await libraryContentService.bulkUpsertContent(payload.library_id, items)

  return {
    success: true,
    data: {
      target_language: payload.target_language,
      days_translated: upserted,
      total_source_days: sourceContent.length
    }
  }
}
