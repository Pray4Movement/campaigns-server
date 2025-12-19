#!/usr/bin/env tsx

import postgres from 'postgres'
import { readFileSync } from 'fs'
import { join } from 'path'

// Load .env file
function loadEnv() {
  try {
    const envPath = join(process.cwd(), '.env')
    const envContent = readFileSync(envPath, 'utf-8')

    envContent.split('\n').forEach(line => {
      // Skip empty lines and comments
      if (!line || line.trim().startsWith('#')) return

      const [key, ...valueParts] = line.split('=')
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim()
        process.env[key.trim()] = value
      }
    })
  } catch (error) {
    console.warn('⚠️  Could not load .env file:', error)
  }
}

async function resetMigrations() {
  console.log('🔄 Resetting migrations...\n')

  // Load environment variables from .env
  loadEnv()

  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    console.error('❌ No DATABASE_URL found in environment variables.')
    console.error('Please set DATABASE_URL in your .env file or environment.')
    process.exit(1)
  }

  const sql = postgres(databaseUrl, {
    max: 5
  })

  try {
    // Test connection
    await sql`SELECT NOW()`
    console.log('✅ Database connection successful\n')

    // Check if migrations table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'migrations'
      ) as exists
    `

    if (!tableCheck[0]?.exists) {
      console.log('ℹ️  Migrations table does not exist. Nothing to reset.')
      await sql.end()
      return
    }

    // Get count of executed migrations
    const migrationCount = await sql`
      SELECT COUNT(*) as count FROM migrations
    `
    const count = migrationCount[0]?.count || 0

    console.log(`📊 Found ${count} executed migration(s) in the migrations table\n`)

    // Drop the migrations table
    console.log('🗑️  Dropping migrations table...')
    await sql`DROP TABLE IF EXISTS migrations CASCADE`

    console.log('✅ Migrations table dropped successfully\n')
    console.log('📝 Next steps:')
    console.log('   1. Restart your application with: npm run dev')
    console.log('   2. All migrations will be executed again from scratch')
    console.log('   3. Existing data in other tables will be preserved\n')

  } catch (error) {
    console.error('❌ Failed to reset migrations:', error)
    process.exit(1)
  } finally {
    await sql.end()
  }
}

// Run the reset if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  resetMigrations().catch(console.error)
}

export { resetMigrations }
