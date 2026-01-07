import { getDatabase } from './db'

export type LibraryType = 'static' | 'people_group'

// Virtual People Group library - not stored in database
export const PEOPLE_GROUP_LIBRARY_ID = -1
export const PEOPLE_GROUP_LIBRARY: Library = {
  id: PEOPLE_GROUP_LIBRARY_ID,
  name: 'People Group',
  description: 'Dynamically displays the linked people group information for the campaign',
  type: 'people_group',
  created_at: '2025-01-01T00:00:00.000Z',
  updated_at: '2025-01-01T00:00:00.000Z'
}

// Virtual Daily People Group library - rotates through all people groups
export const DAILY_PEOPLE_GROUP_LIBRARY_ID = -2
export const DAILY_PEOPLE_GROUP_LIBRARY: Library = {
  id: DAILY_PEOPLE_GROUP_LIBRARY_ID,
  name: 'Daily People Group',
  description: 'Displays a different people group each day, rotating through all groups',
  type: 'people_group',
  created_at: '2025-01-01T00:00:00.000Z',
  updated_at: '2025-01-01T00:00:00.000Z'
}

export interface Library {
  id: number
  name: string
  description: string
  type: LibraryType
  created_at: string
  updated_at: string
}

export interface CreateLibraryData {
  name: string
  description?: string
}

export interface UpdateLibraryData {
  name?: string
  description?: string
}

export class LibraryService {
  private db = getDatabase()

  // Create library
  async createLibrary(data: CreateLibraryData): Promise<Library> {
    const { name, description = '' } = data

    const stmt = this.db.prepare(`
      INSERT INTO libraries (name, description)
      VALUES (?, ?)
    `)

    try {
      const result = await stmt.run(name, description)
      const libraryId = result.lastInsertRowid as number
      return (await this.getLibraryById(libraryId))!
    } catch (error: any) {
      if (error.code === '23505') { // PostgreSQL unique violation
        throw new Error('A library with this name already exists')
      }
      throw error
    }
  }

  // Get library by ID
  async getLibraryById(id: number): Promise<Library | null> {
    // Return virtual libraries for special IDs
    if (id === PEOPLE_GROUP_LIBRARY_ID) {
      return PEOPLE_GROUP_LIBRARY
    }
    if (id === DAILY_PEOPLE_GROUP_LIBRARY_ID) {
      return DAILY_PEOPLE_GROUP_LIBRARY
    }

    const stmt = this.db.prepare(`
      SELECT * FROM libraries WHERE id = ?
    `)
    const library = await stmt.get(id) as Library | null
    return library
  }

  // Get all libraries
  async getAllLibraries(options?: {
    search?: string
    limit?: number
    offset?: number
  }): Promise<Library[]> {
    let query = `SELECT * FROM libraries`
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
    const libraries = await stmt.all(...params) as Library[]
    return libraries
  }

  // Update library
  async updateLibrary(id: number, data: UpdateLibraryData): Promise<Library | null> {
    const library = await this.getLibraryById(id)
    if (!library) {
      return null
    }

    const updates: string[] = []
    const values: any[] = []

    if (data.name !== undefined) {
      updates.push('name = ?')
      values.push(data.name)
    }

    if (data.description !== undefined) {
      updates.push('description = ?')
      values.push(data.description)
    }

    if (updates.length === 0) {
      return library
    }

    updates.push("updated_at = CURRENT_TIMESTAMP AT TIME ZONE 'UTC'")
    values.push(id)

    const stmt = this.db.prepare(`
      UPDATE libraries SET ${updates.join(', ')}
      WHERE id = ?
    `)

    try {
      await stmt.run(...values)
      return this.getLibraryById(id)
    } catch (error: any) {
      if (error.code === '23505') { // PostgreSQL unique violation
        throw new Error('A library with this name already exists')
      }
      throw error
    }
  }

  // Delete library
  async deleteLibrary(id: number): Promise<boolean> {
    const stmt = this.db.prepare('DELETE FROM libraries WHERE id = ?')
    const result = await stmt.run(id)
    return result.changes > 0
  }

  // Get library statistics
  async getLibraryStats(id: number): Promise<{
    totalDays: number
    languageStats: { [key: string]: number }
  }> {
    // Virtual People Group libraries have "infinite" days
    if (id === PEOPLE_GROUP_LIBRARY_ID || id === DAILY_PEOPLE_GROUP_LIBRARY_ID) {
      return {
        totalDays: -1, // -1 indicates continuous/infinite
        languageStats: {}
      }
    }

    // Check if this is a people_group library (shouldn't happen anymore, but keep for safety)
    const library = await this.getLibraryById(id)
    if (library?.type === 'people_group') {
      return {
        totalDays: -1,
        languageStats: {}
      }
    }

    // Get total unique days
    const daysStmt = this.db.prepare(`
      SELECT COUNT(DISTINCT day_number) as count
      FROM library_content
      WHERE library_id = ?
    `)
    const daysResult = await daysStmt.get(id) as { count: number }

    // Get content count by language
    const langStmt = this.db.prepare(`
      SELECT language_code, COUNT(*) as count
      FROM library_content
      WHERE library_id = ?
      GROUP BY language_code
    `)
    const langResults = await langStmt.all(id) as Array<{ language_code: string; count: number }>

    const languageStats: { [key: string]: number } = {}
    langResults.forEach(r => {
      languageStats[r.language_code] = r.count
    })

    return {
      totalDays: daysResult.count,
      languageStats
    }
  }

}

// Export singleton instance
export const libraryService = new LibraryService()
