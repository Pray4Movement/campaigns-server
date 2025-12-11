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
    // Get current subscriber data before update to track changes
    const existing = await db.prepare(`
      SELECT id, name, email, phone, frequency, time_preference, status
      FROM reminder_signups WHERE id = ?
    `).get(subscriberId) as {
      id: number
      name: string
      email: string | null
      phone: string | null
      frequency: string | null
      time_preference: string | null
      status: string
    } | undefined

    if (!existing) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Subscriber not found'
      })
    }

    // Build changes object
    const changes: Record<string, { from: any; to: any }> = {}
    const newValues = {
      name,
      email: email || null,
      phone: phone || null,
      frequency: frequency || null,
      time_preference: time_preference || null,
      status: status || 'active'
    }

    for (const [key, newValue] of Object.entries(newValues)) {
      const oldValue = existing[key as keyof typeof existing]
      if (oldValue !== newValue) {
        changes[key] = { from: oldValue, to: newValue }
      }
    }

    // Update subscriber
    await db.prepare(`
      UPDATE reminder_signups
      SET
        name = ?,
        email = ?,
        phone = ?,
        frequency = ?,
        time_preference = ?,
        status = ?,
        updated_at = NOW()
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

    // Log the update with field changes if any changes were made
    if (Object.keys(changes).length > 0) {
      logUpdate('reminder_signups', subscriberId, event, { changes })
    }

    // Get updated subscriber
    const subscriber = await db.prepare(`
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
