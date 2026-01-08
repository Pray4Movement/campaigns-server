import { translationJobsService } from '#server/database/translation-jobs'

/**
 * Get translation job batch status
 *
 * GET /api/admin/translation-jobs/[batchId]/status
 *
 * Returns job statistics for the batch
 */
export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const batchId = event.context.params?.batchId

  if (!batchId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid batch ID'
    })
  }

  const stats = await translationJobsService.getBatchStats(batchId)
  const isComplete = await translationJobsService.isBatchComplete(batchId)

  return {
    batchId,
    ...stats,
    isComplete
  }
})
