import { updatePrayerStats } from '../../../utils/prayer-stats'

/**
 * API endpoint to manually trigger prayer stats update
 * Protected endpoint - requires admin authentication
 */
export default defineEventHandler(async (event) => {
  // Verify admin authentication
  await requireAdmin(event)

  console.log('Manual prayer stats update triggered by admin')

  try {
    await updatePrayerStats()

    return {
      success: true,
      message: 'Prayer counts updated successfully'
    }
  } catch (error: any) {
    console.error('Prayer stats update error:', error)

    throw createError({
      statusCode: 500,
      statusMessage: 'Update failed',
      message: error.message || 'An error occurred while updating prayer counts'
    })
  }
})
