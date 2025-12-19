class BaseMigration {
  async exec(sql, query) {
    await sql.unsafe(query)
  }

  async columnExists(sql, tableName, columnName) {
    const result = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = ${tableName}
        AND column_name = ${columnName}
      ) as exists
    `
    return result[0]?.exists || false
  }

  async indexExists(sql, indexName) {
    const result = await sql`
      SELECT EXISTS (
        SELECT FROM pg_indexes
        WHERE schemaname = 'public'
        AND indexname = ${indexName}
      ) as exists
    `
    return result[0]?.exists || false
  }
}

export default class AddProfileIdMigration extends BaseMigration {
  id = 14
  name = 'Add profile_id to subscribers for secure profile access'

  async up(sql) {
    console.log('📥 Adding profile_id column to subscribers...')

    // Add profile_id column
    const columnExists = await this.columnExists(sql, 'subscribers', 'profile_id')
    if (!columnExists) {
      await this.exec(sql, `
        ALTER TABLE subscribers
        ADD COLUMN profile_id TEXT UNIQUE
      `)
      console.log('  ✅ Added profile_id column')

      // Generate profile_id for existing subscribers
      await this.exec(sql, `
        UPDATE subscribers
        SET profile_id = gen_random_uuid()::text
        WHERE profile_id IS NULL
      `)
      console.log('  ✅ Generated profile_id for existing subscribers')

      // Make it NOT NULL after populating
      await this.exec(sql, `
        ALTER TABLE subscribers
        ALTER COLUMN profile_id SET NOT NULL
      `)
      console.log('  ✅ Set profile_id as NOT NULL')
    } else {
      console.log('  ℹ️  profile_id column already exists')
    }

    // Create index for profile_id lookups
    const indexExists = await this.indexExists(sql, 'idx_subscribers_profile_id')
    if (!indexExists) {
      await this.exec(sql, `
        CREATE INDEX idx_subscribers_profile_id ON subscribers(profile_id)
      `)
      console.log('  ✅ Created index on profile_id')
    }

    console.log('🎉 Profile ID migration completed!')
  }
}
