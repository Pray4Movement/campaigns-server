import { getDatabase } from './db'
import { roleService } from './roles'
import { campaignAccessService } from './campaign-access'

export interface Campaign {
  id: number
  slug: string
  title: string
  description: string
  status: 'active' | 'inactive'
  default_language: string
  created_at: string
  updated_at: string
}

export interface CreateCampaignData {
  title: string
  description?: string
  slug?: string
  status?: 'active' | 'inactive'
  default_language?: string
}

export interface UpdateCampaignData {
  title?: string
  description?: string
  slug?: string
  status?: 'active' | 'inactive'
  default_language?: string
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
  async isSlugUnique(slug: string, excludeId?: number): Promise<boolean> {
    const stmt = this.db.prepare(`
      SELECT id FROM campaigns WHERE slug = ? ${excludeId ? 'AND id != ?' : ''}
    `)
    const result = excludeId ? await stmt.get(slug, excludeId) : await stmt.get(slug)
    return !result
  }

  // Generate unique slug
  async generateUniqueSlug(title: string, excludeId?: number): Promise<string> {
    let slug = this.generateSlug(title)
    let counter = 1

    while (!(await this.isSlugUnique(slug, excludeId))) {
      slug = `${this.generateSlug(title)}-${counter}`
      counter++
    }

    return slug
  }

  // Create a new campaign
  async createCampaign(data: CreateCampaignData): Promise<Campaign> {
    const { title, description = '', status = 'active', default_language = 'en' } = data

    // Generate unique slug if not provided
    const slug = data.slug || await this.generateUniqueSlug(title)

    // Validate slug is unique
    if (!(await this.isSlugUnique(slug))) {
      throw new Error('Slug already exists')
    }

    const stmt = this.db.prepare(`
      INSERT INTO campaigns (slug, title, description, status, default_language)
      VALUES (?, ?, ?, ?, ?)
    `)

    try {
      const result = await stmt.run(slug, title, description, status, default_language)
      return (await this.getCampaignById(result.lastInsertRowid as number))!
    } catch (error: any) {
      if (error.code === '23505') { // PostgreSQL unique violation
        throw new Error('Campaign with this slug already exists')
      }
      throw error
    }
  }

  // Get campaign by ID
  async getCampaignById(id: number): Promise<Campaign | null> {
    const stmt = this.db.prepare(`
      SELECT id, slug, title, description, status, default_language, created_at, updated_at
      FROM campaigns
      WHERE id = ?
    `)

    return await stmt.get(id) as Campaign | null
  }

  // Get campaign by slug
  async getCampaignBySlug(slug: string): Promise<Campaign | null> {
    const stmt = this.db.prepare(`
      SELECT id, slug, title, description, status, default_language, created_at, updated_at
      FROM campaigns
      WHERE slug = ?
    `)

    return await stmt.get(slug) as Campaign | null
  }

  // Get all campaigns
  async getAllCampaigns(statusFilter?: 'active' | 'inactive'): Promise<Campaign[]> {
    let query = `
      SELECT id, slug, title, description, status, default_language, created_at, updated_at
      FROM campaigns
    `

    if (statusFilter) {
      query += ' WHERE status = ?'
    }

    query += ' ORDER BY created_at DESC'

    const stmt = this.db.prepare(query)

    return statusFilter
      ? await stmt.all(statusFilter) as Campaign[]
      : await stmt.all() as Campaign[]
  }

  // Update campaign
  async updateCampaign(id: number, data: UpdateCampaignData): Promise<Campaign | null> {
    const campaign = await this.getCampaignById(id)
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
      if (!(await this.isSlugUnique(data.slug, id))) {
        throw new Error('Slug already exists')
      }
      updates.push('slug = ?')
      values.push(data.slug)
    }

    if (data.status !== undefined) {
      updates.push('status = ?')
      values.push(data.status)
    }

    if (data.default_language !== undefined) {
      updates.push('default_language = ?')
      values.push(data.default_language)
    }

    if (updates.length === 0) {
      return campaign
    }

    updates.push("updated_at = CURRENT_TIMESTAMP AT TIME ZONE 'UTC'")
    values.push(id)

    const stmt = this.db.prepare(`
      UPDATE campaigns SET ${updates.join(', ')}
      WHERE id = ?
    `)

    await stmt.run(...values)
    return this.getCampaignById(id)
  }

  // Delete campaign
  async deleteCampaign(id: number): Promise<boolean> {
    const stmt = this.db.prepare('DELETE FROM campaigns WHERE id = ?')
    const result = await stmt.run(id)
    return result.changes > 0
  }

  // Get campaign count
  async getCampaignCount(statusFilter?: 'active' | 'inactive'): Promise<number> {
    let query = 'SELECT COUNT(*) as count FROM campaigns'

    if (statusFilter) {
      query += ' WHERE status = ?'
    }

    const stmt = this.db.prepare(query)
    const result = statusFilter
      ? await stmt.get(statusFilter) as { count: number }
      : await stmt.get() as { count: number }

    return result.count
  }

  // Check if user can access a campaign
  // Admins can access all campaigns, campaign editors can only access assigned campaigns
  async userCanAccessCampaign(userId: string, campaignId: number): Promise<boolean> {
    // Check if user is admin
    const isAdmin = await roleService.isAdmin(userId)
    if (isAdmin) {
      return true
    }

    // Check if user has access to this specific campaign
    return await campaignAccessService.userHasAccess(userId, campaignId)
  }

  // Get all campaigns accessible to a user (based on their role)
  async getCampaignsForUser(userId: string, statusFilter?: 'active' | 'inactive'): Promise<Campaign[]> {
    // Check if user is admin
    const isAdmin = await roleService.isAdmin(userId)
    if (isAdmin) {
      // Admins see all campaigns
      return this.getAllCampaigns(statusFilter)
    }

    // Get campaign IDs user has access to
    const campaignIds = await campaignAccessService.getUserCampaigns(userId)
    if (campaignIds.length === 0) {
      return []
    }

    // Build query to get only accessible campaigns
    let query = `
      SELECT id, slug, title, description, status, default_language, created_at, updated_at
      FROM campaigns
      WHERE id IN (${campaignIds.map(() => '?').join(',')})
    `

    if (statusFilter) {
      query += ' AND status = ?'
    }

    query += ' ORDER BY created_at DESC'

    const stmt = this.db.prepare(query)
    const params = statusFilter ? [...campaignIds, statusFilter] : campaignIds

    return await stmt.all(...params) as Campaign[]
  }
}

// Export singleton instance
export const campaignService = new CampaignService()
