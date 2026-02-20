import { getDatabase } from './db'

export interface CampaignLibraryConfig {
  id: number
  people_group_id: number
  library_id: number
  order_index: number
  enabled: boolean
  created_at: string
  updated_at: string
}

export interface CreateCampaignLibraryConfigData {
  people_group_id: number
  library_id: number
  order_index: number
  enabled?: boolean
}

export interface UpdateCampaignLibraryConfigData {
  order_index?: number
  enabled?: boolean
}

export class CampaignLibraryConfigService {
  private db = getDatabase()

  // Add library to people group
  async addLibraryToCampaign(data: CreateCampaignLibraryConfigData): Promise<CampaignLibraryConfig> {
    const {
      people_group_id,
      library_id,
      order_index,
      enabled = true
    } = data

    const stmt = this.db.prepare(`
      INSERT INTO campaign_library_config (people_group_id, library_id, order_index, enabled)
      VALUES (?, ?, ?, ?)
    `)

    try {
      const result = await stmt.run(people_group_id, library_id, order_index, enabled)
      const configId = result.lastInsertRowid as number
      return (await this.getConfigById(configId))!
    } catch (error: any) {
      if (error.code === '23505') { // PostgreSQL unique violation
        throw new Error('This library is already configured for this people group')
      }
      throw error
    }
  }

  // Get config by ID
  async getConfigById(id: number): Promise<CampaignLibraryConfig | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM campaign_library_config WHERE id = ?
    `)
    const config = await stmt.get(id) as CampaignLibraryConfig | null
    return config
  }

  // Get all libraries for a people group (ordered)
  async getCampaignLibraries(peopleGroupId: number, includeDisabled: boolean = false): Promise<CampaignLibraryConfig[]> {
    let query = `
      SELECT * FROM campaign_library_config
      WHERE people_group_id = ?
    `
    const params: any[] = [peopleGroupId]

    if (!includeDisabled) {
      query += ' AND enabled = true'
    }

    query += ' ORDER BY order_index ASC'

    const stmt = this.db.prepare(query)
    const configs = await stmt.all(...params) as CampaignLibraryConfig[]
    return configs
  }

  // Get all people groups using a library
  async getLibraryCampaigns(libraryId: number): Promise<CampaignLibraryConfig[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM campaign_library_config
      WHERE library_id = ?
      ORDER BY people_group_id, order_index ASC
    `)
    const configs = await stmt.all(libraryId) as CampaignLibraryConfig[]
    return configs
  }

  // Update config
  async updateConfig(id: number, data: UpdateCampaignLibraryConfigData): Promise<CampaignLibraryConfig | null> {
    const config = await this.getConfigById(id)
    if (!config) {
      return null
    }

    const updates: string[] = []
    const values: any[] = []

    if (data.order_index !== undefined) {
      updates.push('order_index = ?')
      values.push(data.order_index)
    }

    if (data.enabled !== undefined) {
      updates.push('enabled = ?')
      values.push(data.enabled)
    }

    if (updates.length === 0) {
      return config
    }

    updates.push("updated_at = CURRENT_TIMESTAMP AT TIME ZONE 'UTC'")
    values.push(id)

    const stmt = this.db.prepare(`
      UPDATE campaign_library_config SET ${updates.join(', ')}
      WHERE id = ?
    `)

    await stmt.run(...values)
    return this.getConfigById(id)
  }

  // Remove library from people group
  async removeLibraryFromCampaign(id: number): Promise<boolean> {
    const stmt = this.db.prepare('DELETE FROM campaign_library_config WHERE id = ?')
    const result = await stmt.run(id)
    return result.changes > 0
  }

  // Remove library from people group by people_group_id and library_id
  async removeLibraryByCampaignAndLibrary(peopleGroupId: number, libraryId: number): Promise<boolean> {
    const stmt = this.db.prepare('DELETE FROM campaign_library_config WHERE people_group_id = ? AND library_id = ?')
    const result = await stmt.run(peopleGroupId, libraryId)
    return result.changes > 0
  }

  // Update order of all libraries for a people group (bulk update)
  async updateCampaignLibrariesOrder(peopleGroupId: number, libraryOrders: Array<{ library_id: number; order_index: number }>): Promise<void> {
    for (const { library_id, order_index } of libraryOrders) {
      const stmt = this.db.prepare(`
        UPDATE campaign_library_config
        SET order_index = ?, updated_at = CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
        WHERE people_group_id = ? AND library_id = ?
      `)
      await stmt.run(order_index, peopleGroupId, library_id)
    }
  }

  // Set libraries for people group (replaces existing configuration)
  async setCampaignLibraries(peopleGroupId: number, libraryIds: number[]): Promise<void> {
    // Delete existing configurations
    const deleteStmt = this.db.prepare('DELETE FROM campaign_library_config WHERE people_group_id = ?')
    await deleteStmt.run(peopleGroupId)

    // Add new configurations
    for (let i = 0; i < libraryIds.length; i++) {
      const insertStmt = this.db.prepare(`
        INSERT INTO campaign_library_config (people_group_id, library_id, order_index, enabled)
        VALUES (?, ?, ?, true)
      `)
      await insertStmt.run(peopleGroupId, libraryIds[i], i + 1)
    }
  }
}

// Export singleton instance
export const campaignLibraryConfigService = new CampaignLibraryConfigService()
