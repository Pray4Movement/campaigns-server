import { getDatabase } from './db'

export interface FollowupResponse {
  id: number
  subscription_id: number
  response: 'committed' | 'sometimes' | 'not_praying'
  followup_sent_at: string
  responded_at: string
  created_at: string
}

export interface SubscriptionForFollowup {
  id: number
  people_group_id: number
  subscriber_id: number
  frequency: string
  days_of_week: string | null
  status: 'active' | 'inactive' | 'unsubscribed'
  last_followup_at: string | null
  followup_count: number
  followup_reminder_count: number
  created_at: string
  // Joined fields
  subscriber_name: string
  subscriber_tracking_id: string
  subscriber_profile_id: string
  subscriber_language: string
  email_value: string
  campaign_slug: string
  campaign_title: string
  // Calculated
  last_activity_at: string | null
}

class FollowupTrackingService {
  private db = getDatabase()

  /**
   * Get the last prayer activity timestamp for a subscriber on a campaign.
   * Returns null if no activity found.
   */
  async getLastActivityAt(subscriberId: number, peopleGroupId: number): Promise<string | null> {
    const stmt = this.db.prepare(`
      SELECT MAX(pa.timestamp) as last_activity_at
      FROM prayer_activity pa
      JOIN subscribers s ON pa.tracking_id = s.tracking_id
      WHERE s.id = ? AND pa.people_group_id = ?
    `)
    const result = await stmt.get(subscriberId, peopleGroupId) as { last_activity_at: string | null }
    return result?.last_activity_at || null
  }

  /**
   * Get all active subscriptions that are due for a follow-up check.
   * This returns subscriptions where:
   * - status = 'active'
   * - delivery_method = 'email'
   * - subscriber has a verified email
   *
   * The scheduler will then calculate if each subscription is due based on:
   * - last_activity_at (from prayer_activity)
   * - followup_count (determines 1-month vs 3-month interval)
   */
  async getActiveSubscriptionsForFollowup(): Promise<SubscriptionForFollowup[]> {
    const stmt = this.db.prepare(`
      SELECT
        cs.id,
        cs.people_group_id,
        cs.subscriber_id,
        cs.frequency,
        cs.days_of_week,
        cs.status,
        cs.last_followup_at,
        cs.followup_count,
        cs.followup_reminder_count,
        cs.created_at,
        s.name as subscriber_name,
        s.tracking_id as subscriber_tracking_id,
        s.profile_id as subscriber_profile_id,
        s.preferred_language as subscriber_language,
        cm.value as email_value,
        pg.slug as campaign_slug,
        pg.name as campaign_title,
        (
          SELECT MAX(pa.timestamp)
          FROM prayer_activity pa
          WHERE pa.tracking_id = s.tracking_id AND pa.people_group_id = cs.people_group_id
        ) as last_activity_at
      FROM campaign_subscriptions cs
      JOIN subscribers s ON s.id = cs.subscriber_id
      JOIN people_groups pg ON pg.id = cs.people_group_id
      LEFT JOIN contact_methods cm ON cm.subscriber_id = s.id AND cm.type = 'email'
      WHERE cs.status = 'active'
        AND cs.delivery_method = 'email'
        AND cm.verified = true
      ORDER BY cs.created_at ASC
    `)
    return await stmt.all() as SubscriptionForFollowup[]
  }

  /**
   * Record a follow-up response from a subscriber.
   */
  async recordResponse(
    subscriptionId: number,
    response: 'committed' | 'sometimes' | 'not_praying',
    followupSentAt: Date
  ): Promise<FollowupResponse> {
    const stmt = this.db.prepare(`
      INSERT INTO followup_responses (subscription_id, response, followup_sent_at)
      VALUES (?, ?, ?)
    `)
    const result = await stmt.run(subscriptionId, response, followupSentAt.toISOString())

    const getStmt = this.db.prepare('SELECT * FROM followup_responses WHERE id = ?')
    return await getStmt.get(result.lastInsertRowid as number) as FollowupResponse
  }

  /**
   * Get the most recent follow-up response for a subscription.
   */
  async getLatestResponse(subscriptionId: number): Promise<FollowupResponse | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM followup_responses
      WHERE subscription_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `)
    return await stmt.get(subscriptionId) as FollowupResponse | null
  }

  /**
   * Get all follow-up responses for a subscription.
   */
  async getResponseHistory(subscriptionId: number): Promise<FollowupResponse[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM followup_responses
      WHERE subscription_id = ?
      ORDER BY created_at DESC
    `)
    return await stmt.all(subscriptionId) as FollowupResponse[]
  }

  /**
   * Check if there's been any prayer activity since the last follow-up was sent.
   */
  async hasActivitySinceLastFollowup(subscriptionId: number): Promise<boolean> {
    const stmt = this.db.prepare(`
      SELECT EXISTS (
        SELECT 1
        FROM prayer_activity pa
        JOIN subscribers s ON pa.tracking_id = s.tracking_id
        JOIN campaign_subscriptions cs ON cs.subscriber_id = s.id AND cs.people_group_id = pa.people_group_id
        WHERE cs.id = ?
          AND cs.last_followup_at IS NOT NULL
          AND pa.timestamp > cs.last_followup_at
      ) as has_activity
    `)
    const result = await stmt.get(subscriptionId) as { has_activity: boolean }
    return result?.has_activity || false
  }
}

export const followupTrackingService = new FollowupTrackingService()
