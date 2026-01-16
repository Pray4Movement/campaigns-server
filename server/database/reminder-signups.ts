import { getDatabase } from './db'
import { randomUUID } from 'crypto'
import { calculateNextReminderUtc, calculateNextReminderAfterSend } from '../utils/next-reminder-calculator'

export interface ReminderSignup {
  id: number
  campaign_id: number
  tracking_id: string
  name: string
  email: string
  phone: string
  delivery_method: 'email' | 'whatsapp' | 'app'
  frequency: string
  days_of_week: string | null // JSON string array for weekly frequency
  time_preference: string
  prayer_duration: number // Duration in minutes (5, 10, 15, 30, 60)
  timezone: string // IANA timezone (e.g., "America/New_York")
  next_reminder_utc: string | null // Pre-calculated next reminder time in UTC
  status: 'active' | 'inactive' | 'unsubscribed'
  email_verified: boolean
  verification_token: string | null
  verification_token_expires_at: string | null
  verified_at: string | null
  created_at: string
  updated_at: string
}

export interface CreateReminderSignupInput {
  campaign_id: number
  name: string
  email?: string
  phone?: string
  delivery_method: 'email' | 'whatsapp' | 'app'
  frequency: string
  days_of_week?: number[]
  time_preference: string
  prayer_duration?: number
  timezone?: string
}

class ReminderSignupService {
  private db = getDatabase()

  // Create a new reminder signup
  async createSignup(input: CreateReminderSignupInput): Promise<ReminderSignup> {
    const tracking_id = randomUUID()

    // Validate delivery method has corresponding contact info
    if (input.delivery_method === 'email' && !input.email) {
      throw new Error('Email is required for email delivery')
    }
    if (input.delivery_method === 'whatsapp' && !input.phone) {
      throw new Error('Phone is required for WhatsApp delivery')
    }

    // Serialize days_of_week if provided
    const days_of_week_json = input.days_of_week ? JSON.stringify(input.days_of_week) : null
    const timezone = input.timezone || 'UTC'

    const stmt = this.db.prepare(`
      INSERT INTO reminder_signups (
        campaign_id, tracking_id, name, email, phone,
        delivery_method, frequency, days_of_week, time_preference, prayer_duration, timezone, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `)

    const result = await stmt.run(
      input.campaign_id,
      tracking_id,
      input.name,
      input.email || '',
      input.phone || '',
      input.delivery_method,
      input.frequency,
      days_of_week_json,
      input.time_preference,
      input.prayer_duration || 10,
      timezone
    )

    return (await this.getSignupById(result.lastInsertRowid as number))!
  }

  // Get signup by ID
  async getSignupById(id: number): Promise<ReminderSignup | null> {
    const stmt = this.db.prepare('SELECT * FROM reminder_signups WHERE id = ?')
    return await stmt.get(id) as ReminderSignup | null
  }

  // Get signup by tracking ID
  async getSignupByTrackingId(tracking_id: string): Promise<ReminderSignup | null> {
    const stmt = this.db.prepare('SELECT * FROM reminder_signups WHERE tracking_id = ?')
    return await stmt.get(tracking_id) as ReminderSignup | null
  }

  // Get all signups for a campaign
  async getCampaignSignups(campaignId: number, options?: {
    status?: 'active' | 'inactive' | 'unsubscribed'
    limit?: number
    offset?: number
  }): Promise<ReminderSignup[]> {
    let query = 'SELECT * FROM reminder_signups WHERE campaign_id = ?'
    const params: any[] = [campaignId]

    if (options?.status) {
      query += ' AND status = ?'
      params.push(options.status)
    }

    query += ' ORDER BY created_at DESC'

    if (options?.limit) {
      query += ' LIMIT ?'
      params.push(options.limit)

      if (options?.offset) {
        query += ' OFFSET ?'
        params.push(options.offset)
      }
    }

    const stmt = this.db.prepare(query)
    return await stmt.all(...params) as ReminderSignup[]
  }

  // Update signup status
  async updateSignupStatus(id: number, status: 'active' | 'inactive' | 'unsubscribed'): Promise<ReminderSignup | null> {
    const stmt = this.db.prepare(`
      UPDATE reminder_signups
      SET status = ?, updated_at = CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
      WHERE id = ?
    `)
    await stmt.run(status, id)
    return this.getSignupById(id)
  }

  // Unsubscribe by tracking ID
  async unsubscribeByTrackingId(tracking_id: string): Promise<boolean> {
    const stmt = this.db.prepare(`
      UPDATE reminder_signups
      SET status = 'unsubscribed', updated_at = CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
      WHERE tracking_id = ?
    `)
    const result = await stmt.run(tracking_id)
    return result.changes > 0
  }

  // Resubscribe - reactivate a previously unsubscribed signup
  async resubscribe(signupId: number): Promise<boolean> {
    const stmt = this.db.prepare(`
      UPDATE reminder_signups
      SET status = 'active', updated_at = CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
      WHERE id = ?
    `)
    const result = await stmt.run(signupId)

    if (result.changes > 0) {
      // Recalculate next reminder time
      await this.setInitialNextReminder(signupId)
      return true
    }
    return false
  }

  // Delete signup
  async deleteSignup(id: number): Promise<boolean> {
    const stmt = this.db.prepare('DELETE FROM reminder_signups WHERE id = ?')
    const result = await stmt.run(id)
    return result.changes > 0
  }

  // Get count of active signups for a campaign
  async getActiveSignupCount(campaignId: number): Promise<number> {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM reminder_signups
      WHERE campaign_id = ? AND status = 'active'
    `)
    const result = await stmt.get(campaignId) as { count: number }
    return result.count
  }

  // Generate verification token for a signup (7 day expiry)
  async generateVerificationToken(signupId: number): Promise<string> {
    const token = randomUUID()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    const stmt = this.db.prepare(`
      UPDATE reminder_signups
      SET verification_token = ?, verification_token_expires_at = ?, updated_at = CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
      WHERE id = ?
    `)
    await stmt.run(token, expiresAt, signupId)

    return token
  }

  // Get signup by verification token
  async getSignupByVerificationToken(token: string): Promise<ReminderSignup | null> {
    const stmt = this.db.prepare('SELECT * FROM reminder_signups WHERE verification_token = ?')
    return await stmt.get(token) as ReminderSignup | null
  }

  // Check if verification token is expired
  isTokenExpired(signup: ReminderSignup): boolean {
    if (!signup.verification_token_expires_at) return true
    return new Date(signup.verification_token_expires_at) < new Date()
  }

  // Verify signup by token
  async verifyByToken(token: string): Promise<{ success: boolean; signup?: ReminderSignup; error?: string }> {
    const signup = await this.getSignupByVerificationToken(token)

    if (!signup) {
      return { success: false, error: 'Invalid verification token' }
    }

    if (this.isTokenExpired(signup)) {
      return { success: false, error: 'Verification token has expired' }
    }

    if (signup.email_verified) {
      return { success: true, signup, error: 'Email already verified' }
    }

    // Mark as verified and clear token
    const stmt = this.db.prepare(`
      UPDATE reminder_signups
      SET email_verified = true,
          verified_at = CURRENT_TIMESTAMP AT TIME ZONE 'UTC',
          verification_token = NULL,
          verification_token_expires_at = NULL,
          updated_at = CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
      WHERE id = ?
    `)
    await stmt.run(signup.id)

    return { success: true, signup: (await this.getSignupById(signup.id))! }
  }

  // Regenerate verification token (for resend functionality)
  async regenerateVerificationToken(signupId: number): Promise<string | null> {
    const signup = await this.getSignupById(signupId)
    if (!signup || signup.email_verified) {
      return null
    }
    return this.generateVerificationToken(signupId)
  }

  // Get signups that are due for a reminder (next_reminder_utc <= now)
  async getSignupsDueForReminder(): Promise<ReminderSignup[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM reminder_signups
      WHERE next_reminder_utc <= CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
        AND status = 'active'
        AND email_verified = true
        AND delivery_method = 'email'
      ORDER BY next_reminder_utc ASC
    `)
    return await stmt.all() as ReminderSignup[]
  }

  // Update the next reminder UTC time for a signup
  async updateNextReminderUtc(signupId: number, nextUtc: Date): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE reminder_signups
      SET next_reminder_utc = ?, updated_at = CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
      WHERE id = ?
    `)
    await stmt.run(nextUtc.toISOString(), signupId)
  }

  // Calculate and set the initial next reminder time for a signup
  async setInitialNextReminder(signupId: number): Promise<void> {
    const signup = await this.getSignupById(signupId)
    if (!signup) return

    const daysOfWeek = signup.days_of_week ? JSON.parse(signup.days_of_week) : undefined

    const nextUtc = calculateNextReminderUtc({
      timezone: signup.timezone || 'UTC',
      timePreference: signup.time_preference,
      frequency: signup.frequency,
      daysOfWeek
    })

    await this.updateNextReminderUtc(signupId, nextUtc)
  }

  // Calculate and set the next reminder time after sending a reminder
  async setNextReminderAfterSend(signupId: number): Promise<void> {
    const signup = await this.getSignupById(signupId)
    if (!signup) return

    const daysOfWeek = signup.days_of_week ? JSON.parse(signup.days_of_week) : undefined

    const nextUtc = calculateNextReminderAfterSend({
      timezone: signup.timezone || 'UTC',
      timePreference: signup.time_preference,
      frequency: signup.frequency,
      daysOfWeek
    })

    await this.updateNextReminderUtc(signupId, nextUtc)
  }

  // Update subscriber preferences from profile page
  async updateSubscriberPreferences(signupId: number, updates: {
    name?: string
    email?: string
    frequency?: string
    days_of_week?: number[]
    time_preference?: string
    timezone?: string
    prayer_duration?: number
  }): Promise<{ signup: ReminderSignup | null; emailChanged: boolean }> {
    const signup = await this.getSignupById(signupId)
    if (!signup) return { signup: null, emailChanged: false }

    const emailChanged = updates.email !== undefined && updates.email !== signup.email
    const scheduleChanged = (
      updates.time_preference !== undefined ||
      updates.timezone !== undefined ||
      updates.frequency !== undefined ||
      updates.days_of_week !== undefined
    )

    // Build dynamic update query
    const fields: string[] = []
    const values: any[] = []

    if (updates.name !== undefined) {
      fields.push('name = ?')
      values.push(updates.name)
    }
    if (updates.email !== undefined) {
      fields.push('email = ?')
      values.push(updates.email)
    }
    if (updates.frequency !== undefined) {
      fields.push('frequency = ?')
      values.push(updates.frequency)
    }
    if (updates.days_of_week !== undefined) {
      fields.push('days_of_week = ?')
      values.push(JSON.stringify(updates.days_of_week))
    }
    if (updates.time_preference !== undefined) {
      fields.push('time_preference = ?')
      values.push(updates.time_preference)
    }
    if (updates.timezone !== undefined) {
      fields.push('timezone = ?')
      values.push(updates.timezone)
    }
    if (updates.prayer_duration !== undefined) {
      fields.push('prayer_duration = ?')
      values.push(updates.prayer_duration)
    }

    // If email changed, reset verification
    if (emailChanged) {
      fields.push('email_verified = ?')
      values.push(false)
      fields.push('verified_at = ?')
      values.push(null)
    }

    if (fields.length === 0) {
      return { signup, emailChanged: false }
    }

    fields.push("updated_at = CURRENT_TIMESTAMP AT TIME ZONE 'UTC'")
    values.push(signupId)

    const stmt = this.db.prepare(`
      UPDATE reminder_signups
      SET ${fields.join(', ')}
      WHERE id = ?
    `)
    await stmt.run(...values)

    // Recalculate next reminder if schedule changed
    if (scheduleChanged) {
      await this.setInitialNextReminder(signupId)
    }

    return {
      signup: await this.getSignupById(signupId),
      emailChanged
    }
  }
}

export const reminderSignupService = new ReminderSignupService()
