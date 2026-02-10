import { jobQueueService } from '#server/database/job-queue'
import { handleApiError } from '#server/utils/api-helpers'

/**
 * Get status of a bulk day_in_life translation batch.
 *
 * GET /api/admin/superadmin/translate-dinl/status?batchId=...
 */
export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event)

    const query = getQuery(event)
    const batchId = Number(query.batchId)

    if (!batchId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'batchId is required'
      })
    }

    const stats = await jobQueueService.getJobStats('bulk_dinl', batchId)
    const isComplete = await jobQueueService.isComplete('bulk_dinl', batchId)

    return {
      batchId,
      ...stats,
      isComplete
    }
  } catch (error) {
    handleApiError(error, 'Failed to get translation status')
  }
})
