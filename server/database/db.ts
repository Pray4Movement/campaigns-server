import { Pool, PoolClient, QueryResult } from 'pg'
import { readFileSync } from 'fs'
import { join } from 'path'

let pool: Pool | null = null

// PostgreSQL query wrapper that mimics better-sqlite3 API
class PreparedStatement {
  constructor(
    private pool: Pool,
    private sql: string
  ) {}

  // Convert ? placeholders to $1, $2, etc
  private convertPlaceholders(sql: string, params: any[]): { text: string; values: any[] } {
    let paramIndex = 1
    const text = sql.replace(/\?/g, () => `$${paramIndex++}`)
    return { text, values: params }
  }

  async run(...params: any[]): Promise<{ lastInsertRowid: number; changes: number }> {
    const { text, values } = this.convertPlaceholders(this.sql, params)

    // For INSERT statements, add RETURNING id to get the inserted ID
    let finalText = text
    if (text.trim().toUpperCase().startsWith('INSERT')) {
      finalText = text + ' RETURNING id'
    }

    const result = await this.pool.query(finalText, values)

    return {
      lastInsertRowid: result.rows[0]?.id || 0,
      changes: result.rowCount || 0
    }
  }

  async get(...params: any[]): Promise<any> {
    const { text, values } = this.convertPlaceholders(this.sql, params)
    const result = await this.pool.query(text, values)
    return result.rows[0] || null
  }

  async all(...params: any[]): Promise<any[]> {
    const { text, values } = this.convertPlaceholders(this.sql, params)
    const result = await this.pool.query(text, values)
    return result.rows
  }
}

// Database wrapper that mimics better-sqlite3 API
class DatabaseWrapper {
  constructor(private pool: Pool) {}

  prepare(sql: string): PreparedStatement {
    return new PreparedStatement(this.pool, sql)
  }

  async exec(sql: string): Promise<void> {
    await this.pool.query(sql)
  }

  pragma(pragma: string): void {
    // PostgreSQL doesn't use pragmas - this is a no-op for compatibility
    console.log(`Pragma ignored (PostgreSQL): ${pragma}`)
  }

  async close(): Promise<void> {
    await this.pool.end()
  }
}

export function getDatabase(): DatabaseWrapper {
  if (!pool) {
    // Get database URL from environment
    const databaseUrl = process.env.DATABASE_URL

    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set')
    }

    // Create connection pool
    pool = new Pool({
      connectionString: databaseUrl,
      // Connection pool settings
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection cannot be established
    })

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client', err)
    })

    // Initialize schema
    initializeDatabase().catch(err => {
      console.error('Failed to initialize database:', err)
      throw err
    })
  }

  return new DatabaseWrapper(pool)
}

async function initializeDatabase() {
  if (!pool) return

  try {
    // Read and execute schema
    const schemaPath = join(process.cwd(), 'server/database/schema.sql')
    const schema = readFileSync(schemaPath, 'utf-8')

    // Execute schema (PostgreSQL can handle multiple statements in one query)
    await pool.query(schema)

    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Error initializing database:', error)
    throw error
  }
}

export async function closeDatabase() {
  if (pool) {
    await pool.end()
    pool = null
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await closeDatabase()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await closeDatabase()
  process.exit(0)
})
