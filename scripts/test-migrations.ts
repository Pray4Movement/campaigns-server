#!/usr/bin/env tsx

import postgres from 'postgres'
import { MigrationRunner } from '../../../base/server/utils/migrations'

async function testMigrations() {
  console.log('🧪 Testing PostgreSQL migrations system...\n')

  // Get test database URL from environment or use a default test database
  const testDatabaseUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL

  if (!testDatabaseUrl) {
    console.error('❌ No database URL found. Set DATABASE_URL or TEST_DATABASE_URL environment variable.')
    process.exit(1)
  }

  // Create postgres connection for testing
  const sql = postgres(testDatabaseUrl, {
    max: 5
  })

  try {
    // Test connection
    await sql`SELECT NOW()`
    console.log('✅ Database connection successful\n')

    // Initialize migration runner (base layer's MigrationRunner)
    const migrationRunner = new MigrationRunner(sql)

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
    const result = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `

    console.log('📋 Tables in database:')
    result.forEach(row => console.log(`  - ${row.table_name}`))
    console.log('')

    console.log('✅ Migration system test completed successfully!')

  } catch (error) {
    console.error('❌ Migration test failed:', error)
    process.exit(1)
  } finally {
    await sql.end()
  }
}

// Run the test if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testMigrations().catch(console.error)
}

export { testMigrations }
