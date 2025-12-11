import { getDatabase } from './db'
import { calculateNextReminderUtc, calculateNextReminderAfterSend } from '../utils/next-reminder-calculator'
import { contactMethodService } from './contact-methods'

export interface CampaignSubscription {
  id: number
  campaign_id: number
  subscriber_id: number
  delivery_method: 'email' | 'whatsapp' | 'app'
  frequency: string
  days_of_week: string | null
  time_preference: string
  timezone: string
  prayer_duration: number
  next_reminder_utc: string | null
  status: 'active' | 'inactive' | 'unsubscribed'
  created_at: string
  updated_at: string
}

export interface CampaignSubscriptionWithDetails extends CampaignSubscription {
  campaign_title: string
  campaign_slug: string
  subscriber_name: string
  subscriber_tracking_id: string
}

export interface SubscriptionDueForReminder extends CampaignSubscription {
  subscriber_name: string
  subscriber_tracking_id: string
  email_value: string
  email_verified: boolean
  campaign_slug: string
  campaign_title: string
}

export interface CreateSubscriptionInput {
  campaign_id: number
  subscriber_id: number
  delivery_method: 'email' | 'whatsapp' | 'app'
  frequency: string
  days_of_week?: number[]
  time_preference: string
  timezone?: string
  prayer_duration?: number
}

class CampaignSubscriptionService {
  private db = getDatabase()

  async createSubscription(input: CreateSubscriptionInput): Promise<CampaignSubscription> {
    const days_of_week_json = input.days_of_week ? JSON.stringify(input.days_of_week) : null
    const timezone = input.timezone || 'UTC'

    const stmt = this.db.prepare(`
      INSERT INTO campaign_subscriptions (
        campaign_id, subscriber_id, delivery_method, frequency, days_of_week,
        time_preference, timezone, prayer_duration, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `)

    const result = await stmt.run(
      input.campaign_id,
      input.subscriber_id,
      input.delivery_method,
      input.frequency,
      days_of_week_json,
      input.time_preference,
      timezone,
      input.prayer_duration || 10
    )

    const subscription = (await this.getById(result.lastInsertRowid as number))!

    // Set initial next reminder time
    await this.setInitialNextReminder(subscription.id)

    return (await this.getById(subscription.id))!
  }

  async getById(id: number): Promise<CampaignSubscription | null> {
    const stmt = this.db.prepare('SELECT * FROM campaign_subscriptions WHERE id = ?')
    return await stmt.get(id) as CampaignSubscription | null
  }

  async getBySubscriberAndCampaign(
    subscriberId: number,
    campaignId: number
  ): Promise<CampaignSubscription | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM campaign_subscriptions
      WHERE subscriber_id = ? AND campaign_id = ?
    `)
    return await stmt.get(subscriberId, campaignId) as CampaignSubscription | null
  }

  /**
   * Get all subscriptions for a subscriber on a specific campaign
   */
  async getAllBySubscriberAndCampaign(
    subscriberId: number,
    campaignId: number
  ): Promise<CampaignSubscription[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM campaign_subscriptions
      WHERE subscriber_id = ? AND campaign_id = ?
      ORDER BY created_at ASC
    `)
    return await stmt.all(subscriberId, campaignId) as CampaignSubscription[]
  }

  /**
   * Count subscriptions for a subscriber on a specific campaign
   */
  async countBySubscriberAndCampaign(
    subscriberId: number,
    campaignId: number
  ): Promise<number> {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM campaign_subscriptions
      WHERE subscriber_id = ? AND campaign_id = ?
    `)
    const result = await stmt.get(subscriberId, campaignId) as { count: number }
    return result.count
  }

  /**
   * Unsubscribe from all subscriptions for a subscriber on a campaign
   */
  async unsubscribeAllForCampaign(
    subscriberId: number,
    campaignId: number
  ): Promise<number> {
    const stmt = this.db.prepare(`
      UPDATE campaign_subscriptions
      SET status = 'unsubscribed', updated_at = CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
      WHERE subscriber_id = ? AND campaign_id = ?
    `)
    const result = await stmt.run(subscriberId, campaignId)
    return result.changes
  }

  /**
   * Get all subscriptions for a subscriber (with campaign details)
   */
  async getSubscriberSubscriptions(subscriberId: number): Promise<CampaignSubscriptionWithDetails[]> {
    const stmt = this.db.prepare(`
      SELECT
        cs.*,
        c.title as campaign_title,
        c.slug as campaign_slug,
        s.name as subscriber_name,
        s.tracking_id as subscriber_tracking_id
      FROM campaign_subscriptions cs
      JOIN campaigns c ON c.id = cs.campaign_id
      JOIN subscribers s ON s.id = cs.subscriber_id
      WHERE cs.subscriber_id = ?
      ORDER BY cs.created_at DESC
    `)
    return await stmt.all(subscriberId) as CampaignSubscriptionWithDetails[]
  }

  /**
   * Get all subscriptions for a campaign (with subscriber details)
   */
  async getCampaignSubscriptions(
    campaignId: number,
    options?: {
      status?: 'active' | 'inactive' | 'unsubscribed'
      limit?: number
      offset?: number
    }
  ): Promise<CampaignSubscriptionWithDetails[]> {
    let query = `
      SELECT
        cs.*,
        c.title as campaign_title,
        c.slug as campaign_slug,
        s.name as subscriber_name,
        s.tracking_id as subscriber_tracking_id
      FROM campaign_subscriptions cs
      JOIN campaigns c ON c.id = cs.campaign_id
      JOIN subscribers s ON s.id = cs.subscriber_id
      WHERE cs.campaign_id = ?
    `
    const params: any[] = [campaignId]

    if (options?.status) {
      query += ' AND cs.status = ?'
      params.push(options.status)
    }

    query += ' ORDER BY cs.created_at DESC'

    if (options?.limit) {
      query += ' LIMIT ?'
      params.push(options.limit)

      if (options?.offset) {
        query += ' OFFSET ?'
        params.push(options.offset)
      }
    }

    const stmt = this.db.prepare(query)
    return await stmt.all(...params) as CampaignSubscriptionWithDetails[]
  }

  /**
   * Get active subscription count for a campaign
   */
  async getActiveSubscriptionCount(campaignId: number): Promise<number> {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM campaign_subscriptions
      WHERE campaign_id = ? AND status = 'active'
    `)
    const result = await stmt.get(campaignId) as { count: number }
    return result.count
  }

  async updateSubscription(
    id: number,
    updates: {
      delivery_method?: 'email' | 'whatsapp' | 'app'
      frequency?: string
      days_of_week?: number[]
      time_preference?: string
      timezone?: string
      prayer_duration?: number
    }
  ): Promise<CampaignSubscription | null> {
    const fields: string[] = []
    const values: any[] = []
    let scheduleChanged = false

    if (updates.delivery_method !== undefined) {
      fields.push('delivery_method = ?')
      values.push(updates.delivery_method)
    }
    if (updates.frequency !== undefined) {
      fields.push('frequency = ?')
      values.push(updates.frequency)
      scheduleChanged = true
    }
    if (updates.days_of_week !== undefined) {
      fields.push('days_of_week = ?')
      values.push(JSON.stringify(updates.days_of_week))
      scheduleChanged = true
    }
    if (updates.time_preference !== undefined) {
      fields.push('time_preference = ?')
      values.push(updates.time_preference)
      scheduleChanged = true
    }
    if (updates.timezone !== undefined) {
      fields.push('timezone = ?')
      values.push(updates.timezone)
      scheduleChanged = true
    }
    if (updates.prayer_duration !== undefined) {
      fields.push('prayer_duration = ?')
      values.push(updates.prayer_duration)
    }

    if (fields.length === 0) {
      return this.getById(id)
    }

    fields.push("updated_at = CURRENT_TIMESTAMP AT TIME ZONE 'UTC'")
    values.push(id)

    const stmt = this.db.prepare(`
      UPDATE campaign_subscriptions
      SET ${fields.join(', ')}
      WHERE id = ?
    `)
    await stmt.run(...values)

    // Recalculate next reminder if schedule changed
    if (scheduleChanged) {
      await this.setInitialNextReminder(id)
    }

    return this.getById(id)
  }

  async updateStatus(
    id: number,
    status: 'active' | 'inactive' | 'unsubscribed'
  ): Promise<CampaignSubscription | null> {
    const stmt = this.db.prepare(`
      UPDATE campaign_subscriptions
      SET status = ?, updated_at = CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
      WHERE id = ?
    `)
    await stmt.run(status, id)
    return this.getById(id)
  }

  async unsubscribe(id: number): Promise<boolean> {
    const stmt = this.db.prepare(`
      UPDATE campaign_subscriptions
      SET status = 'unsubscribed', updated_at = CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
      WHERE id = ?
    `)
    const result = await stmt.run(id)
    return result.changes > 0
  }

  async resubscribe(id: number): Promise<boolean> {
    const stmt = this.db.prepare(`
      UPDATE campaign_subscriptions
      SET status = 'active', updated_at = CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
      WHERE id = ?
    `)
    const result = await stmt.run(id)

    if (result.changes > 0) {
      await this.setInitialNextReminder(id)
      return true
    }
    return false
  }

  async deleteSubscription(id: number): Promise<boolean> {
    const stmt = this.db.prepare('DELETE FROM campaign_subscriptions WHERE id = ?')
    const result = await stmt.run(id)
    return result.changes > 0
  }

  /**
   * Get subscriptions that are due for a reminder.
   * Only returns subscriptions where:
   * - next_reminder_utc <= now
   * - status = 'active'
   * - delivery_method = 'email' (for now)
   * - The subscriber has a verified email
   */
  async getSubscriptionsDueForReminder(): Promise<SubscriptionDueForReminder[]> {
    const stmt = this.db.prepare(`
      SELECT
        cs.*,
        s.name as subscriber_name,
        s.tracking_id as subscriber_tracking_id,
        cm.value as email_value,
        cm.verified as email_verified,
        c.slug as campaign_slug,
        c.title as campaign_title
      FROM campaign_subscriptions cs
      JOIN subscribers s ON s.id = cs.subscriber_id
      JOIN campaigns c ON c.id = cs.campaign_id
      LEFT JOIN contact_methods cm ON cm.subscriber_id = s.id AND cm.type = 'email'
      WHERE cs.next_reminder_utc <= CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
        AND cs.status = 'active'
        AND cs.delivery_method = 'email'
        AND cm.verified = true
      ORDER BY cs.next_reminder_utc ASC
    `)
    return await stmt.all() as SubscriptionDueForReminder[]
  }

  async updateNextReminderUtc(subscriptionId: number, nextUtc: Date): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE campaign_subscriptions
      SET next_reminder_utc = ?, updated_at = CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
      WHERE id = ?
    `)
    await stmt.run(nextUtc.toISOString(), subscriptionId)
  }

  async setInitialNextReminder(subscriptionId: number): Promise<void> {
    const subscription = await this.getById(subscriptionId)
    if (!subscription) return

    const daysOfWeek = subscription.days_of_week ? JSON.parse(subscription.days_of_week) : undefined

    const nextUtc = calculateNextReminderUtc({
      timezone: subscription.timezone || 'UTC',
      timePreference: subscription.time_preference,
      frequency: subscription.frequency,
      daysOfWeek
    })

    await this.updateNextReminderUtc(subscriptionId, nextUtc)
  }

  async setNextReminderAfterSend(subscriptionId: number): Promise<void> {
    const subscription = await this.getById(subscriptionId)
    if (!subscription) return

    const daysOfWeek = subscription.days_of_week ? JSON.parse(subscription.days_of_week) : undefined

    const nextUtc = calculateNextReminderAfterSend({
      timezone: subscription.timezone || 'UTC',
      timePreference: subscription.time_preference,
      frequency: subscription.frequency,
      daysOfWeek
    })

    await this.updateNextReminderUtc(subscriptionId, nextUtc)
  }

  /**
   * Set initial next reminder for all active email subscriptions of a subscriber.
   * Called after a contact method is verified.
   */
  async setNextRemindersForSubscriber(subscriberId: number): Promise<void> {
    const stmt = this.db.prepare(`
      SELECT id FROM campaign_subscriptions
      WHERE subscriber_id = ? AND status = 'active' AND delivery_method = 'email'
    `)
    const subscriptions = await stmt.all(subscriberId) as { id: number }[]

    for (const sub of subscriptions) {
      await this.setInitialNextReminder(sub.id)
    }
  }
}

export const campaignSubscriptionService = new CampaignSubscriptionService()
