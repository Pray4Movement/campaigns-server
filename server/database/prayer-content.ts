import { getDatabase } from './db'

export interface PrayerContent {
  id: number
  campaign_id: number
  content_date: string
  language_code: string
  title: string
  content_json: string | null
  created_at: string
  updated_at: string
}

export interface CreatePrayerContentData {
  campaign_id: number
  content_date: string
  language_code: string
  title: string
  content_json?: any
}

export interface UpdatePrayerContentData {
  title?: string
  content_json?: any
  content_date?: string
  language_code?: string
}

export class PrayerContentService {
  private db = getDatabase()

  // Create prayer content
  createPrayerContent(data: CreatePrayerContentData): PrayerContent {
    const {
      campaign_id,
      content_date,
      language_code,
      title,
      content_json = null
    } = data

    const contentJsonString = content_json ? JSON.stringify(content_json) : null

    const stmt = this.db.prepare(`
      INSERT INTO prayer_content (campaign_id, content_date, language_code, title, content_json)
      VALUES (?, ?, ?, ?, ?)
    `)

    try {
      const result = stmt.run(campaign_id, content_date, language_code, title, contentJsonString)
      const contentId = result.lastInsertRowid as number

      return this.getPrayerContentById(contentId)!
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        throw new Error('Content already exists for this campaign, date, and language')
      }
      throw error
    }
  }

  // Get prayer content by ID
  getPrayerContentById(id: number): PrayerContent | null {
    const contentStmt = this.db.prepare(`
      SELECT * FROM prayer_content WHERE id = ?
    `)
    const content = contentStmt.get(id) as PrayerContent | null
    return content
  }

  // Get prayer content by campaign, date, and language
  getPrayerContentByDate(campaignId: number, date: string, languageCode: string = 'en'): PrayerContent | null {
    const contentStmt = this.db.prepare(`
      SELECT * FROM prayer_content WHERE campaign_id = ? AND content_date = ? AND language_code = ?
    `)
    const content = contentStmt.get(campaignId, date, languageCode) as PrayerContent | null
    return content
  }

  // Get all languages available for a specific campaign and date
  getAvailableLanguages(campaignId: number, date: string): string[] {
    const stmt = this.db.prepare(`
      SELECT language_code FROM prayer_content
      WHERE campaign_id = ? AND content_date = ?
      ORDER BY language_code
    `)
    const results = stmt.all(campaignId, date) as Array<{ language_code: string }>
    return results.map(r => r.language_code)
  }

  // Get all prayer content for a campaign
  getCampaignPrayerContent(campaignId: number, options?: {
    startDate?: string
    endDate?: string
    language?: string
    limit?: number
    offset?: number
  }): PrayerContent[] {
    let query = `
      SELECT * FROM prayer_content WHERE campaign_id = ?
    `
    const params: any[] = [campaignId]

    if (options?.startDate) {
      query += ' AND content_date >= ?'
      params.push(options.startDate)
    }

    if (options?.endDate) {
      query += ' AND content_date <= ?'
      params.push(options.endDate)
    }

    if (options?.language) {
      query += ' AND language_code = ?'
      params.push(options.language)
    }

    query += ' ORDER BY content_date DESC, language_code'

    if (options?.limit) {
      query += ' LIMIT ?'
      params.push(options.limit)

      if (options?.offset) {
        query += ' OFFSET ?'
        params.push(options.offset)
      }
    }

    const stmt = this.db.prepare(query)
    const contents = stmt.all(...params) as PrayerContent[]
    return contents
  }

  // Get prayer content grouped by date with language information
  getCampaignContentGroupedByDate(campaignId: number, options?: {
    startDate?: string
    endDate?: string
    limit?: number
    offset?: number
  }): Array<{ date: string; languages: string[] }> {
    let query = `
      SELECT content_date as date, GROUP_CONCAT(language_code) as languages
      FROM prayer_content
      WHERE campaign_id = ?
    `
    const params: any[] = [campaignId]

    if (options?.startDate) {
      query += ' AND content_date >= ?'
      params.push(options.startDate)
    }

    if (options?.endDate) {
      query += ' AND content_date <= ?'
      params.push(options.endDate)
    }

    query += ' GROUP BY content_date ORDER BY content_date DESC'

    if (options?.limit) {
      query += ' LIMIT ?'
      params.push(options.limit)

      if (options?.offset) {
        query += ' OFFSET ?'
        params.push(options.offset)
      }
    }

    const stmt = this.db.prepare(query)
    const results = stmt.all(...params) as Array<{ date: string; languages: string }>
    return results.map(r => ({
      date: r.date,
      languages: r.languages.split(',')
    }))
  }

  // Update prayer content
  updatePrayerContent(id: number, data: UpdatePrayerContentData): PrayerContent | null {
    const content = this.getPrayerContentById(id)
    if (!content) {
      return null
    }

    const updates: string[] = []
    const values: any[] = []

    if (data.title !== undefined) {
      updates.push('title = ?')
      values.push(data.title)
    }

    if (data.content_json !== undefined) {
      updates.push('content_json = ?')
      values.push(data.content_json ? JSON.stringify(data.content_json) : null)
    }

    if (data.content_date !== undefined) {
      updates.push('content_date = ?')
      values.push(data.content_date)
    }

    if (data.language_code !== undefined) {
      updates.push('language_code = ?')
      values.push(data.language_code)
    }

    if (updates.length === 0) {
      return content
    }

    updates.push('updated_at = CURRENT_TIMESTAMP')
    values.push(id)

    const stmt = this.db.prepare(`
      UPDATE prayer_content SET ${updates.join(', ')}
      WHERE id = ?
    `)

    stmt.run(...values)
    return this.getPrayerContentById(id)
  }

  // Delete prayer content
  deletePrayerContent(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM prayer_content WHERE id = ?')
    const result = stmt.run(id)
    return result.changes > 0
  }

  // Get content count for campaign
  getContentCount(campaignId: number): number {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM prayer_content WHERE campaign_id = ?')
    const result = stmt.get(campaignId) as { count: number }
    return result.count
  }
}

// Export singleton instance
export const prayerContentService = new PrayerContentService()
