import { getDatabase } from './db'
import { roleService } from './roles'
import { campaignAccessService } from './campaign-access'

export interface MarketingEmail {
  id: number
  subject: string
  content_json: string
  audience_type: 'doxa' | 'campaign'
  campaign_id: number | null
  status: 'draft' | 'queued' | 'sending' | 'sent' | 'failed'
  created_by: string
  updated_by: string | null
  sent_by: string | null
  created_at: string
  updated_at: string
  sent_at: string | null
  recipient_count: number
  sent_count: number
  failed_count: number
}

export interface MarketingEmailWithCampaign extends MarketingEmail {
  campaign_title?: string
  campaign_slug?: string
  created_by_name?: string
  created_by_email?: string
  updated_by_name?: string
  updated_by_email?: string
  sent_by_name?: string
  sent_by_email?: string
}

export interface CreateMarketingEmailData {
  subject: string
  content_json: string
  audience_type: 'doxa' | 'campaign'
  campaign_id?: number | null
  created_by: string
}

export interface UpdateMarketingEmailData {
  subject?: string
  content_json?: string
  audience_type?: 'doxa' | 'campaign'
  campaign_id?: number | null
  updated_by: string
}

export interface MarketingEmailFilters {
  status?: 'draft' | 'queued' | 'sending' | 'sent' | 'failed'
  audience_type?: 'doxa' | 'campaign'
  campaign_id?: number
}

class MarketingEmailService {
  private db = getDatabase()

  async create(data: CreateMarketingEmailData): Promise<MarketingEmail> {
    const { subject, content_json, audience_type, campaign_id, created_by } = data

    if (audience_type === 'campaign' && !campaign_id) {
      throw new Error('campaign_id is required when audience_type is campaign')
    }

    if (audience_type === 'doxa' && campaign_id) {
      throw new Error('campaign_id should not be provided when audience_type is doxa')
    }

    const stmt = this.db.prepare(`
      INSERT INTO marketing_emails (subject, content_json, audience_type, campaign_id, created_by)
      VALUES (?, ?, ?, ?, ?)
    `)

    const result = await stmt.run(
      subject,
      content_json,
      audience_type,
      audience_type === 'campaign' ? campaign_id : null,
      created_by
    )

    return (await this.getById(result.lastInsertRowid as number))!
  }

  async getById(id: number): Promise<MarketingEmail | null> {
    const stmt = this.db.prepare('SELECT * FROM marketing_emails WHERE id = ?')
    return await stmt.get(id) as MarketingEmail | null
  }

  async getByIdWithCampaign(id: number): Promise<MarketingEmailWithCampaign | null> {
    const stmt = this.db.prepare(`
      SELECT me.*, c.title as campaign_title, c.slug as campaign_slug
      FROM marketing_emails me
      LEFT JOIN campaigns c ON me.campaign_id = c.id
      WHERE me.id = ?
    `)
    return await stmt.get(id) as MarketingEmailWithCampaign | null
  }

  async update(id: number, data: UpdateMarketingEmailData): Promise<MarketingEmail | null> {
    const email = await this.getById(id)
    if (!email) return null

    if (email.status !== 'draft') {
      throw new Error('Only drafts can be edited')
    }

    const updates: string[] = []
    const values: any[] = []

    if (data.subject !== undefined) {
      updates.push('subject = ?')
      values.push(data.subject)
    }

    if (data.content_json !== undefined) {
      updates.push('content_json = ?')
      values.push(data.content_json)
    }

    if (data.audience_type !== undefined) {
      updates.push('audience_type = ?')
      values.push(data.audience_type)
    }

    if (data.campaign_id !== undefined) {
      updates.push('campaign_id = ?')
      values.push(data.campaign_id)
    }

    if (data.updated_by) {
      updates.push('updated_by = ?')
      values.push(data.updated_by)
    }

    if (updates.length === 0) {
      return email
    }

    updates.push("updated_at = CURRENT_TIMESTAMP AT TIME ZONE 'UTC'")
    values.push(id)

    const stmt = this.db.prepare(`
      UPDATE marketing_emails SET ${updates.join(', ')}
      WHERE id = ?
    `)

    await stmt.run(...values)
    return this.getById(id)
  }

  async delete(id: number): Promise<boolean> {
    const email = await this.getById(id)
    if (!email) return false

    if (email.status !== 'draft') {
      throw new Error('Only drafts can be deleted')
    }

    const stmt = this.db.prepare('DELETE FROM marketing_emails WHERE id = ?')
    const result = await stmt.run(id)
    return result.changes > 0
  }

  async listForUser(userId: string, filters?: MarketingEmailFilters): Promise<MarketingEmailWithCampaign[]> {
    const isAdmin = await roleService.isAdmin(userId)

    let query = `
      SELECT me.*,
        c.title as campaign_title,
        c.slug as campaign_slug,
        u_created.display_name as created_by_name,
        u_created.email as created_by_email,
        u_updated.display_name as updated_by_name,
        u_updated.email as updated_by_email,
        u_sent.display_name as sent_by_name,
        u_sent.email as sent_by_email
      FROM marketing_emails me
      LEFT JOIN campaigns c ON me.campaign_id = c.id
      LEFT JOIN users u_created ON me.created_by = u_created.id
      LEFT JOIN users u_updated ON me.updated_by = u_updated.id
      LEFT JOIN users u_sent ON me.sent_by = u_sent.id
    `
    const conditions: string[] = []
    const values: any[] = []

    if (!isAdmin) {
      const campaignIds = await campaignAccessService.getUserCampaigns(userId)
      if (campaignIds.length === 0) {
        conditions.push('(me.audience_type = ? AND me.created_by = ?)')
        values.push('campaign', userId)
      } else {
        conditions.push(`(
          (me.audience_type = 'campaign' AND me.campaign_id IN (${campaignIds.map(() => '?').join(',')}))
          OR me.created_by = ?
        )`)
        values.push(...campaignIds, userId)
      }
    }

    if (filters?.status) {
      conditions.push('me.status = ?')
      values.push(filters.status)
    }

    if (filters?.audience_type) {
      conditions.push('me.audience_type = ?')
      values.push(filters.audience_type)
    }

    if (filters?.campaign_id) {
      conditions.push('me.campaign_id = ?')
      values.push(filters.campaign_id)
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ')
    }

    query += ' ORDER BY me.updated_at DESC'

    const stmt = this.db.prepare(query)
    return await stmt.all(...values) as MarketingEmailWithCampaign[]
  }

  async updateStatus(id: number, status: MarketingEmail['status'], sentBy?: string): Promise<void> {
    const updates: string[] = ['status = ?', "updated_at = CURRENT_TIMESTAMP AT TIME ZONE 'UTC'"]
    const values: any[] = [status]

    if (status === 'queued' && sentBy) {
      updates.push('sent_by = ?')
      values.push(sentBy)
    }

    if (status === 'sent' || status === 'failed') {
      updates.push("sent_at = CURRENT_TIMESTAMP AT TIME ZONE 'UTC'")
    }

    values.push(id)

    const stmt = this.db.prepare(`
      UPDATE marketing_emails SET ${updates.join(', ')}
      WHERE id = ?
    `)
    await stmt.run(...values)
  }

  async updateStats(id: number, recipientCount: number, sentCount: number, failedCount: number): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE marketing_emails
      SET recipient_count = ?, sent_count = ?, failed_count = ?, updated_at = CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
      WHERE id = ?
    `)
    await stmt.run(recipientCount, sentCount, failedCount, id)
  }

  async incrementSentCount(id: number): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE marketing_emails
      SET sent_count = sent_count + 1, updated_at = CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
      WHERE id = ?
    `)
    await stmt.run(id)
  }

  async incrementFailedCount(id: number): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE marketing_emails
      SET failed_count = failed_count + 1, updated_at = CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
      WHERE id = ?
    `)
    await stmt.run(id)
  }

  async canUserAccessEmail(userId: string, emailId: number): Promise<boolean> {
    const email = await this.getById(emailId)
    if (!email) return false

    const isAdmin = await roleService.isAdmin(userId)
    if (isAdmin) return true

    if (email.audience_type === 'doxa') {
      return email.created_by === userId
    }

    if (email.audience_type === 'campaign' && email.campaign_id) {
      return await campaignAccessService.userHasAccess(userId, email.campaign_id)
    }

    return email.created_by === userId
  }

  async canUserSendToAudience(userId: string, audienceType: 'doxa' | 'campaign', campaignId?: number): Promise<boolean> {
    const isAdmin = await roleService.isAdmin(userId)

    if (audienceType === 'doxa') {
      return isAdmin
    }

    if (audienceType === 'campaign' && campaignId) {
      if (isAdmin) return true
      return await campaignAccessService.userHasAccess(userId, campaignId)
    }

    return false
  }
}

export const marketingEmailService = new MarketingEmailService()
