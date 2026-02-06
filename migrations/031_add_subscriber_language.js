class BaseMigration {
  async exec(sql, query) {
    await sql.unsafe(query)
  }

  async tableExists(sql, tableName) {
    const result = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = ${tableName}
      ) as exists
    `
    return result[0]?.exists || false
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

export default class AddSubscriberLanguageMigration extends BaseMigration {
  id = 31
  name = 'Add preferred language to subscribers'

  async up(sql) {
    console.log('📥 Adding preferred_language column to subscribers...')

    const preferredLanguageExists = await this.columnExists(sql, 'subscribers', 'preferred_language')
    if (!preferredLanguageExists) {
      await this.exec(sql, `
        ALTER TABLE subscribers
        ADD COLUMN preferred_language VARCHAR(10) DEFAULT 'en'
      `)
      console.log('  ✅ Added preferred_language column')
    } else {
      console.log('  ℹ️  preferred_language column already exists')
    }

    console.log('🎉 Subscriber language migration completed!')
  }
}
