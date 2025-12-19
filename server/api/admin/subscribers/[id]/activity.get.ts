import { campaignSubscriptionService } from '#server/database/campaign-subscriptions'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const subscriptionId = getRouterParam(event, 'id')

  if (!subscriptionId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Subscription ID is required'
    })
  }

  // Verify subscription exists
  const subscription = await campaignSubscriptionService.getById(parseInt(subscriptionId))
  if (!subscription) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Subscription not found'
    })
  }

  try {
    // Fetch activity logs for this subscription
    // Also check for legacy logs that might reference reminder_signups
    const activities = await sql`
      SELECT
        al.id,
        al.timestamp,
        al.event_type,
        al.table_name,
        al.user_id,
        al.metadata,
        u.display_name as user_name
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE (
        (al.table_name = 'campaign_subscriptions' AND al.record_id = ${subscriptionId})
        OR (al.table_name = 'reminder_signups' AND al.record_id = ${subscriptionId})
      )
      ORDER BY al.timestamp DESC
      LIMIT 100
    `

    return {
      activities: activities.map((a: any) => ({
        id: a.id,
        timestamp: typeof a.timestamp === 'string' ? parseInt(a.timestamp, 10) : a.timestamp,
        eventType: a.event_type,
        tableName: a.table_name,
        userId: a.user_id,
        userName: a.user_name,
        metadata: typeof a.metadata === 'string' ? JSON.parse(a.metadata) : a.metadata
      }))
    }
  } catch (error: any) {
    console.error('Error fetching subscriber activity:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch subscriber activity'
    })
  }
})
