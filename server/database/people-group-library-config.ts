import { getDatabase } from './db'

export interface PeopleGroupLibraryConfig {
  id: number
  people_group_id: number
  library_id: number
  order_index: number
  enabled: boolean
  created_at: string
  updated_at: string
}

export interface CreatePeopleGroupLibraryConfigData {
  people_group_id: number
  library_id: number
  order_index: number
  enabled?: boolean
}

export interface UpdatePeopleGroupLibraryConfigData {
  order_index?: number
  enabled?: boolean
}

export class PeopleGroupLibraryConfigService {
  private db = getDatabase()

  async addLibraryToPeopleGroup(data: CreatePeopleGroupLibraryConfigData): Promise<PeopleGroupLibraryConfig> {
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
      if (error.code === '23505') {
        throw new Error('This library is already configured for this people group')
      }
      throw error
    }
  }

  async getConfigById(id: number): Promise<PeopleGroupLibraryConfig | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM campaign_library_config WHERE id = ?
    `)
    const config = await stmt.get(id) as PeopleGroupLibraryConfig | null
    return config
  }

  async getPeopleGroupLibraries(peopleGroupId: number, includeDisabled: boolean = false): Promise<PeopleGroupLibraryConfig[]> {
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
    const configs = await stmt.all(...params) as PeopleGroupLibraryConfig[]
    return configs
  }

  async getLibraryPeopleGroups(libraryId: number): Promise<PeopleGroupLibraryConfig[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM campaign_library_config
      WHERE library_id = ?
      ORDER BY people_group_id, order_index ASC
    `)
    const configs = await stmt.all(libraryId) as PeopleGroupLibraryConfig[]
    return configs
  }

  async updateConfig(id: number, data: UpdatePeopleGroupLibraryConfigData): Promise<PeopleGroupLibraryConfig | null> {
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

  async removeLibraryFromPeopleGroup(id: number): Promise<boolean> {
    const stmt = this.db.prepare('DELETE FROM campaign_library_config WHERE id = ?')
    const result = await stmt.run(id)
    return result.changes > 0
  }

  async removeLibraryByPeopleGroupAndLibrary(peopleGroupId: number, libraryId: number): Promise<boolean> {
    const stmt = this.db.prepare('DELETE FROM campaign_library_config WHERE people_group_id = ? AND library_id = ?')
    const result = await stmt.run(peopleGroupId, libraryId)
    return result.changes > 0
  }

  async updatePeopleGroupLibrariesOrder(peopleGroupId: number, libraryOrders: Array<{ library_id: number; order_index: number }>): Promise<void> {
    for (const { library_id, order_index } of libraryOrders) {
      const stmt = this.db.prepare(`
        UPDATE campaign_library_config
        SET order_index = ?, updated_at = CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
        WHERE people_group_id = ? AND library_id = ?
      `)
      await stmt.run(order_index, peopleGroupId, library_id)
    }
  }

  async setPeopleGroupLibraries(peopleGroupId: number, libraryIds: number[]): Promise<void> {
    const deleteStmt = this.db.prepare('DELETE FROM campaign_library_config WHERE people_group_id = ?')
    await deleteStmt.run(peopleGroupId)

    for (let i = 0; i < libraryIds.length; i++) {
      const insertStmt = this.db.prepare(`
        INSERT INTO campaign_library_config (people_group_id, library_id, order_index, enabled)
        VALUES (?, ?, ?, true)
      `)
      await insertStmt.run(peopleGroupId, libraryIds[i], i + 1)
    }
  }
}

export const peopleGroupLibraryConfigService = new PeopleGroupLibraryConfigService()
