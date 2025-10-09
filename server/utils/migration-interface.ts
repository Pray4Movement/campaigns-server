import type { Pool } from 'pg'

export interface Migration {
  id: number
  name: string
  up(pool: Pool): Promise<void>
  down?(pool: Pool): Promise<void>
}

export abstract class BaseMigration implements Migration {
  abstract id: number
  abstract name: string
  abstract up(pool: Pool): Promise<void>

  down?(pool: Pool): Promise<void> {
    throw new Error(`Down migration not implemented for migration ${this.id}`)
  }

  protected async exec(pool: Pool, sql: string): Promise<void> {
    await pool.query(sql)
  }

  protected async query(pool: Pool, sql: string, params: any[] = []): Promise<any[]> {
    const result = await pool.query(sql, params)
    return result.rows
  }

  protected async queryOne(pool: Pool, sql: string, params: any[] = []): Promise<any | null> {
    const result = await pool.query(sql, params)
    return result.rows[0] || null
  }

  protected async tableExists(pool: Pool, tableName: string): Promise<boolean> {
    const result = await pool.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = $1
      ) as exists`,
      [tableName]
    )
    return result.rows[0]?.exists || false
  }

  protected async columnExists(pool: Pool, tableName: string, columnName: string): Promise<boolean> {
    const result = await pool.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = $1
        AND column_name = $2
      ) as exists`,
      [tableName, columnName]
    )
    return result.rows[0]?.exists || false
  }

  protected async indexExists(pool: Pool, indexName: string): Promise<boolean> {
    const result = await pool.query(
      `SELECT EXISTS (
        SELECT FROM pg_indexes
        WHERE schemaname = 'public'
        AND indexname = $1
      ) as exists`,
      [indexName]
    )
    return result.rows[0]?.exists || false
  }
}
