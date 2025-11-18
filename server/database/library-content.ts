import { getDatabase } from './db'

export interface LibraryContent {
  id: number
  library_id: number
  day_number: number
  language_code: string
  title: string
  content_json: string | null
  created_at: string
  updated_at: string
}

export interface CreateLibraryContentData {
  library_id: number
  day_number: number
  language_code: string
  title: string
  content_json?: any
}

export interface UpdateLibraryContentData {
  title?: string
  content_json?: any
  day_number?: number
  language_code?: string
}

export class LibraryContentService {
  private db = getDatabase()

  // Create library content
  async createLibraryContent(data: CreateLibraryContentData): Promise<LibraryContent> {
    const {
      library_id,
      day_number,
      language_code,
      title,
      content_json = null
    } = data

    const contentJsonString = content_json ? JSON.stringify(content_json) : null

    const stmt = this.db.prepare(`
      INSERT INTO library_content (library_id, day_number, language_code, title, content_json)
      VALUES (?, ?, ?, ?, ?)
    `)

    try {
      const result = await stmt.run(library_id, day_number, language_code, title, contentJsonString)
      const contentId = result.lastInsertRowid as number

      return (await this.getLibraryContentById(contentId))!
    } catch (error: any) {
      if (error.code === '23505') { // PostgreSQL unique violation
        throw new Error('Content already exists for this library, day, and language')
      }
      throw error
    }
  }

  // Get library content by ID
  async getLibraryContentById(id: number): Promise<LibraryContent | null> {
    const contentStmt = this.db.prepare(`
      SELECT * FROM library_content WHERE id = ?
    `)
    const content = await contentStmt.get(id) as LibraryContent | null
    return content
  }

  // Get library content by day and language
  async getLibraryContentByDay(libraryId: number, dayNumber: number, languageCode: string = 'en'): Promise<LibraryContent | null> {
    const contentStmt = this.db.prepare(`
      SELECT * FROM library_content WHERE library_id = ? AND day_number = ? AND language_code = ?
    `)
    const content = await contentStmt.get(libraryId, dayNumber, languageCode) as LibraryContent | null
    return content
  }

  // Get all languages available for a specific library and day
  async getAvailableLanguages(libraryId: number, dayNumber: number): Promise<string[]> {
    const stmt = this.db.prepare(`
      SELECT language_code FROM library_content
      WHERE library_id = ? AND day_number = ?
      ORDER BY language_code
    `)
    const results = await stmt.all(libraryId, dayNumber) as Array<{ language_code: string }>
    return results.map(r => r.language_code)
  }

  // Get all library content for a library
  async getLibraryContent(libraryId: number, options?: {
    startDay?: number
    endDay?: number
    language?: string
    limit?: number
    offset?: number
  }): Promise<LibraryContent[]> {
    let query = `
      SELECT * FROM library_content WHERE library_id = ?
    `
    const params: any[] = [libraryId]

    if (options?.startDay !== undefined) {
      query += ' AND day_number >= ?'
      params.push(options.startDay)
    }

    if (options?.endDay !== undefined) {
      query += ' AND day_number <= ?'
      params.push(options.endDay)
    }

    if (options?.language) {
      query += ' AND language_code = ?'
      params.push(options.language)
    }

    query += ' ORDER BY day_number ASC, language_code'

    if (options?.limit) {
      query += ' LIMIT ?'
      params.push(options.limit)

      if (options?.offset) {
        query += ' OFFSET ?'
        params.push(options.offset)
      }
    }

    const stmt = this.db.prepare(query)
    const contents = await stmt.all(...params) as LibraryContent[]

    return contents
  }

  // Get library content grouped by day with language information
  async getLibraryContentGroupedByDay(libraryId: number, options?: {
    startDay?: number
    endDay?: number
    limit?: number
    offset?: number
  }): Promise<Array<{ dayNumber: number; languages: string[] }>> {
    let query = `
      SELECT day_number as "dayNumber", STRING_AGG(language_code, ',') as languages
      FROM library_content
      WHERE library_id = ?
    `
    const params: any[] = [libraryId]

    if (options?.startDay !== undefined) {
      query += ' AND day_number >= ?'
      params.push(options.startDay)
    }

    if (options?.endDay !== undefined) {
      query += ' AND day_number <= ?'
      params.push(options.endDay)
    }

    query += ' GROUP BY day_number ORDER BY day_number ASC'

    if (options?.limit) {
      query += ' LIMIT ?'
      params.push(options.limit)

      if (options?.offset) {
        query += ' OFFSET ?'
        params.push(options.offset)
      }
    }

    const stmt = this.db.prepare(query)
    const results = await stmt.all(...params) as Array<{ dayNumber: number; languages: string }>
    return results.map(r => ({
      dayNumber: r.dayNumber,
      languages: r.languages.split(',')
    }))
  }

  // Get day range for library (min and max day numbers)
  async getDayRange(libraryId: number): Promise<{ minDay: number; maxDay: number } | null> {
    const stmt = this.db.prepare(`
      SELECT MIN(day_number) as "minDay", MAX(day_number) as "maxDay"
      FROM library_content
      WHERE library_id = ?
    `)
    const result = await stmt.get(libraryId) as { minDay: number | null; maxDay: number | null } | null

    if (!result || result.minDay === null || result.maxDay === null) {
      return null
    }

    return {
      minDay: result.minDay,
      maxDay: result.maxDay
    }
  }

  // Update library content
  async updateLibraryContent(id: number, data: UpdateLibraryContentData): Promise<LibraryContent | null> {
    const content = await this.getLibraryContentById(id)
    if (!content) {
      return null
    }

    // If day or language is being updated, check for conflicts with other records
    if (data.day_number !== undefined || data.language_code !== undefined) {
      const checkDay = data.day_number !== undefined ? data.day_number : content.day_number
      const checkLanguage = data.language_code !== undefined ? data.language_code : content.language_code

      const conflictStmt = this.db.prepare(`
        SELECT id FROM library_content
        WHERE library_id = ? AND day_number = ? AND language_code = ? AND id != ?
      `)
      const conflict = await conflictStmt.get(content.library_id, checkDay, checkLanguage, id)

      if (conflict) {
        throw new Error('Content already exists for this library, day, and language')
      }
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

    if (data.day_number !== undefined) {
      updates.push('day_number = ?')
      values.push(data.day_number)
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
      UPDATE library_content SET ${updates.join(', ')}
      WHERE id = ?
    `)

    await stmt.run(...values)
    return this.getLibraryContentById(id)
  }

  // Delete library content
  async deleteLibraryContent(id: number): Promise<boolean> {
    const stmt = this.db.prepare('DELETE FROM library_content WHERE id = ?')
    const result = await stmt.run(id)
    return result.changes > 0
  }

  // Get content count for library
  async getContentCount(libraryId: number): Promise<number> {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM library_content WHERE library_id = ?')
    const result = await stmt.get(libraryId) as { count: number }
    return result.count
  }

  // Check if content exists for specific day and language
  async hasContentForDay(libraryId: number, dayNumber: number, languageCode?: string): Promise<boolean> {
    let query = 'SELECT COUNT(*) as count FROM library_content WHERE library_id = ? AND day_number = ?'
    const params: any[] = [libraryId, dayNumber]

    if (languageCode) {
      query += ' AND language_code = ?'
      params.push(languageCode)
    }

    const stmt = this.db.prepare(query)
    const result = await stmt.get(...params) as { count: number }
    return result.count > 0
  }
}

// Export singleton instance
export const libraryContentService = new LibraryContentService()
