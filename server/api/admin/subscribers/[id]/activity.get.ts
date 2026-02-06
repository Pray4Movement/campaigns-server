import { campaignSubscriptionService } from '#server/database/campaign-subscriptions'
import { campaignService } from '#server/database/campaigns'
import { handleApiError, getIntParam } from '#server/utils/api-helpers'

export default defineEventHandler(async (event) => {
  const user = await requirePermission(event, 'campaigns.view')

  const subscriptionId = getIntParam(event, 'id')

  // Verify subscription exists
  const subscription = await campaignSubscriptionService.getById(subscriptionId)
  if (!subscription) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Subscription not found'
    })
  }

  // Verify user has access to this campaign
  const hasAccess = await campaignService.userCanAccessCampaign(user.userId, subscription.campaign_id)
  if (!hasAccess) {
    throw createError({
      statusCode: 403,
      statusMessage: 'You do not have access to this subscription'
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

    // Get tracking_id from subscriber to fetch prayer activity
    const subscriberResult = await sql`
      SELECT s.tracking_id
      FROM campaign_subscriptions cs
      JOIN subscribers s ON cs.subscriber_id = s.id
      WHERE cs.id = ${subscriptionId}
    `
    const trackingId = subscriberResult[0]?.tracking_id

    // Fetch prayer activity if tracking_id exists
    let prayerActivities: any[] = []
    if (trackingId) {
      prayerActivities = await sql`
        SELECT
          pa.id,
          pa.timestamp,
          pa.duration,
          pa.campaign_id,
          c.title as campaign_title
        FROM prayer_activity pa
        LEFT JOIN campaigns c ON pa.campaign_id = c.id
        WHERE pa.tracking_id = ${trackingId}
        ORDER BY pa.timestamp DESC
        LIMIT 50
      `
    }

    // Fetch email history for this subscription
    const emailHistory = await sql`
      SELECT
        res.id,
        res.sent_date,
        res.sent_at,
        c.title as campaign_title
      FROM reminder_emails_sent res
      JOIN campaign_subscriptions cs ON res.subscription_id = cs.id
      JOIN campaigns c ON cs.campaign_id = c.id
      WHERE res.subscription_id = ${subscriptionId}
      ORDER BY res.sent_at DESC
      LIMIT 50
    `

    // Format subscription activity logs
    const formattedActivities = activities.map((a: any) => ({
      id: a.id,
      timestamp: typeof a.timestamp === 'string' ? parseInt(a.timestamp, 10) : a.timestamp,
      eventType: a.event_type,
      tableName: a.table_name,
      userId: a.user_id,
      userName: a.user_name,
      metadata: typeof a.metadata === 'string' ? JSON.parse(a.metadata) : a.metadata
    }))

    // Format prayer activities
    const formattedPrayer = prayerActivities.map((pa: any) => ({
      id: `prayer-${pa.id}`,
      timestamp: new Date(pa.timestamp).getTime(),
      eventType: 'PRAYER',
      tableName: 'prayer_activity',
      userId: null,
      userName: null,
      metadata: {
        duration: pa.duration,
        campaignTitle: pa.campaign_title
      }
    }))

    // Format email history
    const formattedEmails = emailHistory.map((e: any) => ({
      id: `email-${e.id}`,
      timestamp: new Date(e.sent_at).getTime(),
      eventType: 'EMAIL',
      tableName: 'reminder_emails_sent',
      userId: null,
      userName: null,
      metadata: {
        sentDate: e.sent_date,
        campaignTitle: e.campaign_title
      }
    }))

    // Fetch follow-up responses for this subscription
    const followupResponses = await sql`
      SELECT
        fr.id,
        fr.response,
        fr.followup_sent_at,
        fr.responded_at,
        c.title as campaign_title
      FROM followup_responses fr
      JOIN campaign_subscriptions cs ON fr.subscription_id = cs.id
      JOIN campaigns c ON cs.campaign_id = c.id
      WHERE fr.subscription_id = ${subscriptionId}
      ORDER BY fr.responded_at DESC
      LIMIT 50
    `

    // Format follow-up responses
    const formattedFollowups = followupResponses.map((fr: any) => ({
      id: `followup-${fr.id}`,
      timestamp: new Date(fr.responded_at).getTime(),
      eventType: 'FOLLOWUP_RESPONSE',
      tableName: 'followup_responses',
      userId: null,
      userName: null,
      metadata: {
        response: fr.response,
        campaignTitle: fr.campaign_title
      }
    }))

    // Combine and sort by timestamp descending
    const allActivities = [...formattedActivities, ...formattedPrayer, ...formattedEmails, ...formattedFollowups]
      .sort((a, b) => b.timestamp - a.timestamp)

    return {
      activities: allActivities
    }
  } catch (error) {
    handleApiError(error, 'Failed to fetch subscriber activity')
  }
})
