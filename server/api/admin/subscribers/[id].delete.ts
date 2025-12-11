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
    // Get subscriber data before deletion for logging
    const existing = await db.prepare(`
      SELECT id, name, email, phone, delivery_method, status
      FROM reminder_signups WHERE id = ?
    `).get(subscriberId) as {
      id: number
      name: string
      email: string | null
      phone: string | null
      delivery_method: string
      status: string
    } | undefined

    if (!existing) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Subscriber not found'
      })
    }

    // Delete subscriber
    await db.prepare('DELETE FROM reminder_signups WHERE id = ?').run(subscriberId)

    // Log the deletion with subscriber details
    logDelete('reminder_signups', subscriberId, event, {
      deletedRecord: {
        name: existing.name,
        email: existing.email,
        phone: existing.phone,
        delivery_method: existing.delivery_method,
        status: existing.status
      }
    })

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
