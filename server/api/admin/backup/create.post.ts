import { createDatabaseBackup } from '#server/utils/backup'

/**
 * API endpoint to manually trigger a database backup
 * Protected endpoint - requires admin authentication
 */
export default defineEventHandler(async (event) => {
  try {
    // Verify admin authentication
    await requireAdmin(event)

    console.log('Manual backup triggered by admin')

    // Create and upload backup
    const result = await createDatabaseBackup()

    if (!result.success) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Backup failed',
        message: result.error || 'Unknown error occurred during backup'
      })
    }

    return {
      success: true,
      message: 'Database backup completed successfully',
      backup: {
        filename: result.filename,
        size: result.size,
        location: result.s3Location
      }
    }
  } catch (error: any) {
    console.error('Backup endpoint error:', error)

    // If it's already a createError, rethrow it
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Backup failed',
      message: error.message || 'An error occurred while creating the backup'
    })
  }
})
