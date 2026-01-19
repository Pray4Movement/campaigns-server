import type { Sql } from 'postgres'
import postgres from 'postgres'

// Test database connection (lazy initialized)
let testSql: ReturnType<typeof postgres> | null = null

function getTestSql(): ReturnType<typeof postgres> | null {
  if (testSql) return testSql

  const testUrl = process.env.TEST_DATABASE_URL
  if (!testUrl) return null

  testSql = postgres(testUrl, {
    ssl: testUrl.includes('localhost') ? false : { rejectUnauthorized: false },
    max: 5,
    idle_timeout: 10,
  })
  return testSql
}

// Get the production sql connection (auto-imported from base layer server/utils/database.ts)
function getProductionSql(): Sql {
  // sql is auto-imported by Nitro from the base layer's server/utils/database.ts
  // @ts-ignore - sql is auto-imported
  return sql
}

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

  /**
   * Execute a function within a database transaction.
   * If the function throws, the transaction is rolled back.
   * If the function succeeds, the transaction is committed.
   *
   * @param fn - The function to execute within the transaction.
   *             Receives a transaction-scoped database wrapper.
   * @returns The result of the function
   */
  async transaction<T>(fn: (tx: DatabaseWrapper) => Promise<T>): Promise<T> {
    return await (this.sql as any).begin(async (txSql: Sql) => {
      const txWrapper = new DatabaseWrapper(txSql)
      return await fn(txWrapper)
    })
  }
}

export function getDatabase(): DatabaseWrapper {
  // In test environment, use test database
  if (process.env.VITEST && process.env.TEST_DATABASE_URL) {
    const testConnection = getTestSql()
    if (testConnection) {
      return new DatabaseWrapper(testConnection as any)
    }
  }

  // Use production sql connection (auto-imported from base layer)
  return new DatabaseWrapper(getProductionSql() as any)
}

