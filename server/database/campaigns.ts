import { getDatabase } from './db'

export interface Campaign {
  id: number
  slug: string
  title: string
  description: string
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export interface CreateCampaignData {
  title: string
  description?: string
  slug?: string
  status?: 'active' | 'inactive'
}

export interface UpdateCampaignData {
  title?: string
  description?: string
  slug?: string
  status?: 'active' | 'inactive'
}

export class CampaignService {
  private db = getDatabase()

  // Generate slug from title
  generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special chars
      .replace(/[\s_-]+/g, '-')  // Replace spaces/underscores with hyphens
      .replace(/^-+|-+$/g, '')   // Remove leading/trailing hyphens
  }

  // Check if slug is unique
  isSlugUnique(slug: string, excludeId?: number): boolean {
    const stmt = this.db.prepare(`
      SELECT id FROM campaigns WHERE slug = ? ${excludeId ? 'AND id != ?' : ''}
    `)
    const result = excludeId ? stmt.get(slug, excludeId) : stmt.get(slug)
    return !result
  }

  // Generate unique slug
  generateUniqueSlug(title: string, excludeId?: number): string {
    let slug = this.generateSlug(title)
    let counter = 1

    while (!this.isSlugUnique(slug, excludeId)) {
      slug = `${this.generateSlug(title)}-${counter}`
      counter++
    }

    return slug
  }

  // Create a new campaign
  createCampaign(data: CreateCampaignData): Campaign {
    const { title, description = '', status = 'active' } = data

    // Generate unique slug if not provided
    const slug = data.slug || this.generateUniqueSlug(title)

    // Validate slug is unique
    if (!this.isSlugUnique(slug)) {
      throw new Error('Slug already exists')
    }

    const stmt = this.db.prepare(`
      INSERT INTO campaigns (slug, title, description, status)
      VALUES (?, ?, ?, ?)
    `)

    try {
      const result = stmt.run(slug, title, description, status)
      return this.getCampaignById(result.lastInsertRowid as number)!
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        throw new Error('Campaign with this slug already exists')
      }
      throw error
    }
  }

  // Get campaign by ID
  getCampaignById(id: number): Campaign | null {
    const stmt = this.db.prepare(`
      SELECT id, slug, title, description, status, created_at, updated_at
      FROM campaigns
      WHERE id = ?
    `)

    return stmt.get(id) as Campaign | null
  }

  // Get campaign by slug
  getCampaignBySlug(slug: string): Campaign | null {
    const stmt = this.db.prepare(`
      SELECT id, slug, title, description, status, created_at, updated_at
      FROM campaigns
      WHERE slug = ?
    `)

    return stmt.get(slug) as Campaign | null
  }

  // Get all campaigns
  getAllCampaigns(statusFilter?: 'active' | 'inactive'): Campaign[] {
    let query = `
      SELECT id, slug, title, description, status, created_at, updated_at
      FROM campaigns
    `

    if (statusFilter) {
      query += ' WHERE status = ?'
    }

    query += ' ORDER BY created_at DESC'

    const stmt = this.db.prepare(query)

    return statusFilter
      ? stmt.all(statusFilter) as Campaign[]
      : stmt.all() as Campaign[]
  }

  // Update campaign
  updateCampaign(id: number, data: UpdateCampaignData): Campaign | null {
    const campaign = this.getCampaignById(id)
    if (!campaign) {
      return null
    }

    const updates: string[] = []
    const values: any[] = []

    if (data.title !== undefined) {
      updates.push('title = ?')
      values.push(data.title)
    }

    if (data.description !== undefined) {
      updates.push('description = ?')
      values.push(data.description)
    }

    if (data.slug !== undefined) {
      // Validate slug is unique (excluding current campaign)
      if (!this.isSlugUnique(data.slug, id)) {
        throw new Error('Slug already exists')
      }
      updates.push('slug = ?')
      values.push(data.slug)
    }

    if (data.status !== undefined) {
      updates.push('status = ?')
      values.push(data.status)
    }

    if (updates.length === 0) {
      return campaign
    }

    updates.push('updated_at = CURRENT_TIMESTAMP')
    values.push(id)

    const stmt = this.db.prepare(`
      UPDATE campaigns SET ${updates.join(', ')}
      WHERE id = ?
    `)

    stmt.run(...values)
    return this.getCampaignById(id)
  }

  // Delete campaign
  deleteCampaign(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM campaigns WHERE id = ?')
    const result = stmt.run(id)
    return result.changes > 0
  }

  // Get campaign count
  getCampaignCount(statusFilter?: 'active' | 'inactive'): number {
    let query = 'SELECT COUNT(*) as count FROM campaigns'

    if (statusFilter) {
      query += ' WHERE status = ?'
    }

    const stmt = this.db.prepare(query)
    const result = statusFilter
      ? stmt.get(statusFilter) as { count: number }
      : stmt.get() as { count: number }

    return result.count
  }
}

// Export singleton instance
export const campaignService = new CampaignService()
