import { getDatabase } from '../../../database/db'

export default defineEventHandler(async (event) => {
  // TODO: Add authentication check
  const subscriberId = getRouterParam(event, 'id')

  if (!subscriberId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Subscriber ID is required'
    })
  }

  const db = getDatabase()

  try {
    // Check if subscriber exists
    const existing = db.prepare('SELECT id FROM reminder_signups WHERE id = ?').get(subscriberId)
    if (!existing) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Subscriber not found'
      })
    }

    // Delete subscriber
    db.prepare('DELETE FROM reminder_signups WHERE id = ?').run(subscriberId)

    return {
      success: true
    }
  } catch (error: any) {
    if (error.statusCode) throw error

    console.error('Error deleting subscriber:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete subscriber'
    })
  }
})
