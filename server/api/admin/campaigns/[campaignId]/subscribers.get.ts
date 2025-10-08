import { getDatabase } from '../../../../database/db'

export default defineEventHandler(async (event) => {
  // TODO: Add authentication check
  const campaignId = getRouterParam(event, 'campaignId')

  if (!campaignId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Campaign ID is required'
    })
  }

  const db = getDatabase()

  try {
    // Get all subscribers for this campaign
    const subscribers = db.prepare(`
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
      WHERE campaign_id = ?
      ORDER BY created_at DESC
    `).all(campaignId)

    return {
      subscribers
    }
  } catch (error) {
    console.error('Error fetching subscribers:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch subscribers'
    })
  }
})
