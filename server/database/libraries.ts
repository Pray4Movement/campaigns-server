import { getDatabase } from './db'

export interface Library {
  id: number
  name: string
  description: string
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

    updates.push('updated_at = CURRENT_TIMESTAMP')
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
