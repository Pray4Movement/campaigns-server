import type { Sql } from 'postgres'
import { sql } from '#imports'

// PostgreSQL query wrapper that mimics better-sqlite3 API
class PreparedStatement {
  constructor(
    private sql: Sql,
    private query: string
  ) {}

  // Convert ? placeholders to $1, $2, etc. and execute query
  private async execute(query: string, params: any[]) {
    // Convert ? placeholders to $1, $2, etc.
    let paramIndex = 1
    const convertedQuery = query.replace(/\?/g, () => `$${paramIndex++}`)

    // Use the postgres tagged template with unsafe to execute
    return await this.sql.unsafe(convertedQuery, params)
  }

  async run(...params: any[]): Promise<{ lastInsertRowid: number; changes: number }> {
    // For INSERT statements, try to get the inserted ID
    if (this.query.trim().toUpperCase().startsWith('INSERT')) {
      try {
        const result = await this.execute(this.query + ' RETURNING id', params)
        return {
          lastInsertRowid: result[0]?.id || 0,
          changes: result.count || 0
        }
      } catch (error: any) {
        // If the table doesn't have an id column, run without RETURNING
        if (error.message?.includes('column "id" does not exist')) {
          const result = await this.execute(this.query, params)
          return {
            lastInsertRowid: 0,
            changes: result.count || 0
          }
        }
        throw error
      }
    }

    const result = await this.execute(this.query, params)
    return {
      lastInsertRowid: 0,
      changes: result.count || 0
    }
  }

  async get(...params: any[]): Promise<any> {
    const result = await this.execute(this.query, params)
    return result[0] || null
  }

  async all(...params: any[]): Promise<any[]> {
    const result = await this.execute(this.query, params)
    return result
  }
}

// Database wrapper that mimics better-sqlite3 API
class DatabaseWrapper {
  constructor(private sql: Sql) {}

  prepare(query: string): PreparedStatement {
    return new PreparedStatement(this.sql, query)
  }

  async exec(query: string): Promise<void> {
    await this.sql.unsafe(query)
  }

  pragma(pragma: string): void {
    // PostgreSQL doesn't use pragmas - this is a no-op for compatibility
    console.log(`Pragma ignored (PostgreSQL): ${pragma}`)
  }

  async close(): Promise<void> {
    await this.sql.end()
  }
}

export function getDatabase(): DatabaseWrapper {
  // sql is auto-imported from base layer's server/utils/database which handles initialization
  return new DatabaseWrapper(sql as any)
}

