#!/usr/bin/env tsx

import { Pool } from 'pg'
import { MigrationRunner } from '../server/utils/migrations'

async function testMigrations() {
  console.log('🧪 Testing PostgreSQL migrations system...\n')

  // Get test database URL from environment or use a default test database
  const testDatabaseUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL

  if (!testDatabaseUrl) {
    console.error('❌ No database URL found. Set DATABASE_URL or TEST_DATABASE_URL environment variable.')
    process.exit(1)
  }

  // Create a connection pool for testing
  const pool = new Pool({
    connectionString: testDatabaseUrl,
    max: 5
  })

  try {
    // Test connection
    await pool.query('SELECT NOW()')
    console.log('✅ Database connection successful\n')

    // Initialize migration runner
    const migrationRunner = new MigrationRunner(pool)
    await migrationRunner.initialize()

    // Get migration status before running
    const statusBefore = await migrationRunner.getMigrationStatus()
    console.log('📊 Migration status before:', statusBefore)
    console.log('')

    // Run migrations
    await migrationRunner.runMigrations()
    console.log('')

    // Get migration status after running
    const statusAfter = await migrationRunner.getMigrationStatus()
    console.log('📊 Migration status after:', statusAfter)
    console.log('')

    // Verify that tables were created
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `)

    console.log('📋 Tables in database:')
    result.rows.forEach(row => console.log(`  - ${row.table_name}`))
    console.log('')

    console.log('✅ Migration system test completed successfully!')

  } catch (error) {
    console.error('❌ Migration test failed:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

// Run the test if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testMigrations().catch(console.error)
}

export { testMigrations }
