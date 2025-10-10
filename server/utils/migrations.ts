import type { Pool } from 'pg'
import { readdir } from 'fs/promises'
import { join } from 'path'
import type { Migration } from './migration-interface'

export class MigrationRunner {
  private pool: Pool

  constructor(pool: Pool) {
    this.pool = pool
  }

  async initialize() {
    await this.initializeMigrationsTable()
  }

  private async initializeMigrationsTable() {
    // Create migrations table if it doesn't exist
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)
  }

  private async loadMigrations(): Promise<Migration[]> {
    const migrationsDir = join(process.cwd(), 'migrations')

    try {
      const files = await readdir(migrationsDir)
      const migrationFiles = files
        .filter(file => file.endsWith('.ts') || file.endsWith('.js'))
        .sort() // Sort alphabetically to ensure order

      const migrations: Migration[] = []

      for (const file of migrationFiles) {
        // Extract migration number from filename (e.g., "001_initial.ts" -> 1)
        const match = file.match(/^(\d+)_(.+)\.(ts|js)$/)
        if (!match) {
          console.warn(`Skipping invalid migration file: ${file}`)
          continue
        }

        const id = parseInt(match[1]!, 10)
        const filePath = join(migrationsDir, file)

        try {
          // Dynamically import the migration module
          // Use absolute file URL for proper module resolution
          const absolutePath = filePath.replace(/\\/g, '/')
          const fileUrl = `file://${absolutePath}`
          const migrationModule = await import(fileUrl)
          const MigrationClass = migrationModule.default

          if (!MigrationClass) {
            console.warn(`Migration file ${file} does not export a default class`)
            continue
          }

          const migrationInstance = new MigrationClass() as Migration

          if (migrationInstance.id !== id) {
            console.warn(`Migration file ${file} has mismatched ID: expected ${id}, got ${migrationInstance.id}`)
            continue
          }

          migrations.push(migrationInstance)
        } catch (error) {
          console.error(`Failed to load migration ${file}:`, error)
          continue
        }
      }

      return migrations.sort((a, b) => a.id - b.id)
    } catch {
      console.warn('Migrations directory not found or empty, skipping migrations')
      return []
    }
  }

  private async getExecutedMigrations(): Promise<number[]> {
    const result = await this.pool.query('SELECT id FROM migrations ORDER BY id')
    return result.rows.map(row => row.id)
  }

  private async executeMigration(migration: Migration) {
    console.log(`Executing migration ${migration.id}: ${migration.name}`)

    // Start a transaction
    const client = await this.pool.connect()

    try {
      await client.query('BEGIN')

      // Execute the migration's up method using the pool
      await migration.up(this.pool)

      // Record that this migration was executed
      await client.query(
        'INSERT INTO migrations (id, name) VALUES ($1, $2)',
        [migration.id, migration.name]
      )

      await client.query('COMMIT')
      console.log(`✓ Migration ${migration.id} completed successfully`)
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  async runMigrations(): Promise<void> {
    console.log('🔄 Checking for pending migrations...')

    const allMigrations = await this.loadMigrations()
    if (allMigrations.length === 0) {
      console.log('📝 No migrations found')
      return
    }

    const executedMigrationIds = await this.getExecutedMigrations()
    const pendingMigrations = allMigrations.filter(
      migration => !executedMigrationIds.includes(migration.id)
    )

    if (pendingMigrations.length === 0) {
      console.log('✅ All migrations are up to date')
      return
    }

    console.log(`📋 Found ${pendingMigrations.length} pending migration(s)`)

    for (const migration of pendingMigrations) {
      try {
        await this.executeMigration(migration)
      } catch (error) {
        console.error(`❌ Migration ${migration.id} failed:`, error)
        throw new Error(`Migration ${migration.id} failed: ${error}`)
      }
    }

    console.log('🎉 All migrations completed successfully')
  }

  async getMigrationStatus(): Promise<{ executed: number[], pending: number[], total: number }> {
    const allMigrations = await this.loadMigrations()
    const executedMigrationIds = await this.getExecutedMigrations()
    const pendingMigrationIds = allMigrations
      .filter(m => !executedMigrationIds.includes(m.id))
      .map(m => m.id)

    return {
      executed: executedMigrationIds,
      pending: pendingMigrationIds,
      total: allMigrations.length
    }
  }
}
