import { translationJobsService } from '#server/database/translation-jobs'

/**
 * Cancel pending translation jobs in a batch
 *
 * POST /api/admin/translation-jobs/[batchId]/cancel
 *
 * Cancels all pending jobs (processing jobs will complete)
 */
export default defineEventHandler(async (event) => {
  await requirePermission(event, 'content.create')

  const batchId = event.context.params?.batchId

  if (!batchId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid batch ID'
    })
  }

  const cancelledCount = await translationJobsService.cancelPendingJobs(batchId)
  const stats = await translationJobsService.getBatchStats(batchId)

  return {
    success: true,
    message: `Cancelled ${cancelledCount} pending job(s)`,
    cancelledCount,
    stats
  }
})
