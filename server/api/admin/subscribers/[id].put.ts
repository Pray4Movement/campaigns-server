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

  const body = await readBody(event)
  const { name, email, phone, frequency, time_preference, status } = body

  if (!name) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Name is required'
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

    // Update subscriber
    db.prepare(`
      UPDATE reminder_signups
      SET
        name = ?,
        email = ?,
        phone = ?,
        frequency = ?,
        time_preference = ?,
        status = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      name,
      email || null,
      phone || null,
      frequency || null,
      time_preference || null,
      status || 'active',
      subscriberId
    )

    // Get updated subscriber
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

    return {
      subscriber
    }
  } catch (error: any) {
    if (error.statusCode) throw error

    console.error('Error updating subscriber:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update subscriber'
    })
  }
})
