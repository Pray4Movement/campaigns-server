import { getDatabase } from './db'
import { randomUUID } from 'crypto'

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

    const stmt = this.db.prepare(`
      INSERT INTO reminder_signups (
        campaign_id, tracking_id, name, email, phone,
        delivery_method, frequency, days_of_week, time_preference, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
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
      input.time_preference
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
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    await stmt.run(status, id)
    return this.getSignupById(id)
  }

  // Unsubscribe by tracking ID
  async unsubscribeByTrackingId(tracking_id: string): Promise<boolean> {
    const stmt = this.db.prepare(`
      UPDATE reminder_signups
      SET status = 'unsubscribed', updated_at = CURRENT_TIMESTAMP
      WHERE tracking_id = ?
    `)
    const result = await stmt.run(tracking_id)
    return result.changes > 0
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

  // Generate verification token for a signup (24 hour expiry)
  async generateVerificationToken(signupId: number): Promise<string> {
    const token = randomUUID()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    const stmt = this.db.prepare(`
      UPDATE reminder_signups
      SET verification_token = ?, verification_token_expires_at = ?, updated_at = CURRENT_TIMESTAMP
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
          verified_at = CURRENT_TIMESTAMP,
          verification_token = NULL,
          verification_token_expires_at = NULL,
          updated_at = CURRENT_TIMESTAMP
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
}

export const reminderSignupService = new ReminderSignupService()
