import { getDatabase } from '#server/database/db'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const subscriberId = getRouterParam(event, 'id')

  if (!subscriberId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Subscriber ID is required'
    })
  }

  const db = getDatabase()

  try {
    const subscriber = db.prepare(`
      SELECT
        id,
        campaign_id,
        name,
        email,
        phone,
        delivery_method,
        frequency,
        time_preference,
        status,
        tracking_id,
        created_at,
        updated_at
      FROM reminder_signups
      WHERE id = ?
    `).get(subscriberId)

    if (!subscriber) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Subscriber not found'
      })
    }

    return {
      subscriber
    }
  } catch (error: any) {
    if (error.statusCode) throw error

    console.error('Error fetching subscriber:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch subscriber'
    })
  }
})
