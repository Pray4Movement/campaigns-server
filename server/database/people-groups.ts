import { getDatabase } from './db'

export interface PeopleGroup {
  id: number
  dt_id: string
  name: string
  image_url: string | null
  metadata: string | null
  created_at: string
  updated_at: string
}

export interface CreatePeopleGroupData {
  dt_id: string
  name: string
  image_url?: string | null
  metadata?: string | null
}

export interface UpdatePeopleGroupData {
  dt_id?: string
  name?: string
  image_url?: string | null
  metadata?: string | null
}

export class PeopleGroupService {
  private db = getDatabase()

  async createPeopleGroup(data: CreatePeopleGroupData): Promise<PeopleGroup> {
    const { dt_id, name, image_url = null, metadata = null } = data

    const stmt = this.db.prepare(`
      INSERT INTO people_groups (dt_id, name, image_url, metadata)
      VALUES (?, ?, ?, ?)
    `)

    try {
      const result = await stmt.run(dt_id, name, image_url, metadata)
      const id = result.lastInsertRowid as number
      return (await this.getPeopleGroupById(id))!
    } catch (error: any) {
      if (error.code === '23505') {
        throw new Error('A people group with this dt_id already exists')
      }
      throw error
    }
  }

  async getPeopleGroupById(id: number): Promise<PeopleGroup | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM people_groups WHERE id = ?
    `)
    const peopleGroup = await stmt.get(id) as PeopleGroup | null
    return peopleGroup
  }

  async getPeopleGroupByDtId(dtId: string): Promise<PeopleGroup | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM people_groups WHERE dt_id = ?
    `)
    const peopleGroup = await stmt.get(dtId) as PeopleGroup | null
    return peopleGroup
  }

  async getAllPeopleGroups(options?: {
    search?: string
    limit?: number
    offset?: number
  }): Promise<PeopleGroup[]> {
    let query = `SELECT * FROM people_groups`
    const params: any[] = []

    if (options?.search) {
      query += ' WHERE name ILIKE ?'
      params.push(`%${options.search}%`)
    }

    query += ' ORDER BY name'

    if (options?.limit) {
      query += ' LIMIT ?'
      params.push(options.limit)

      if (options?.offset) {
        query += ' OFFSET ?'
        params.push(options.offset)
      }
    }

    const stmt = this.db.prepare(query)
    const peopleGroups = await stmt.all(...params) as PeopleGroup[]
    return peopleGroups
  }

  async updatePeopleGroup(id: number, data: UpdatePeopleGroupData): Promise<PeopleGroup | null> {
    const peopleGroup = await this.getPeopleGroupById(id)
    if (!peopleGroup) {
      return null
    }

    const updates: string[] = []
    const values: any[] = []

    if (data.dt_id !== undefined) {
      updates.push('dt_id = ?')
      values.push(data.dt_id)
    }

    if (data.name !== undefined) {
      updates.push('name = ?')
      values.push(data.name)
    }

    if (data.image_url !== undefined) {
      updates.push('image_url = ?')
      values.push(data.image_url)
    }

    if (data.metadata !== undefined) {
      updates.push('metadata = ?')
      values.push(data.metadata)
    }

    if (updates.length === 0) {
      return peopleGroup
    }

    updates.push("updated_at = CURRENT_TIMESTAMP AT TIME ZONE 'UTC'")
    values.push(id)

    const stmt = this.db.prepare(`
      UPDATE people_groups SET ${updates.join(', ')}
      WHERE id = ?
    `)

    try {
      await stmt.run(...values)
      return this.getPeopleGroupById(id)
    } catch (error: any) {
      if (error.code === '23505') {
        throw new Error('A people group with this dt_id already exists')
      }
      throw error
    }
  }

  async deletePeopleGroup(id: number): Promise<boolean> {
    const stmt = this.db.prepare('DELETE FROM people_groups WHERE id = ?')
    const result = await stmt.run(id)
    return result.changes > 0
  }

  async countPeopleGroups(search?: string): Promise<number> {
    let query = 'SELECT COUNT(*) as count FROM people_groups'
    const params: any[] = []

    if (search) {
      query += ' WHERE name ILIKE ?'
      params.push(`%${search}%`)
    }

    const stmt = this.db.prepare(query)
    const result = await stmt.get(...params) as { count: string | number }
    return Number(result.count)
  }
}

export const peopleGroupService = new PeopleGroupService()
