export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const subscriberId = getRouterParam(event, 'id')

  if (!subscriberId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Subscriber ID is required'
    })
  }

  try {
    // Fetch activity logs for this subscriber
    // record_id stores the subscriber ID as a string
    // sql is auto-imported from base layer
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
      WHERE al.table_name = 'reminder_signups'
        AND al.record_id = ${subscriberId}
      ORDER BY al.timestamp DESC
      LIMIT 100
    `

    return {
      activities: activities.map((a: any) => ({
        id: a.id,
        // timestamp is stored as BIGINT (milliseconds), ensure it's a number
        timestamp: typeof a.timestamp === 'string' ? parseInt(a.timestamp, 10) : a.timestamp,
        eventType: a.event_type,
        tableName: a.table_name,
        userId: a.user_id,
        userName: a.user_name,
        // metadata is JSONB, should be object but parse if string
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
