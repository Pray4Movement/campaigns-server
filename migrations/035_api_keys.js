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

export default class CreateApiKeysMigration extends BaseMigration {
  id = 35
  name = 'Create api_keys table'

  async up(sql) {
    console.log('📥 Creating api_keys table...')

    const exists = await this.tableExists(sql, 'api_keys')
    if (!exists) {
      await this.exec(sql, `
        CREATE TABLE api_keys (
          id SERIAL PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          key_hash TEXT NOT NULL,
          key_prefix TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
          last_used_at TIMESTAMP DEFAULT NULL,
          revoked_at TIMESTAMP DEFAULT NULL
        )
      `)
      console.log('  ✅ Created api_keys table')
    } else {
      console.log('  ℹ️  api_keys table already exists')
    }

    const userIdIdx = await this.indexExists(sql, 'idx_api_keys_user_id')
    if (!userIdIdx) {
      await this.exec(sql, `
        CREATE INDEX idx_api_keys_user_id ON api_keys(user_id)
      `)
      console.log('  ✅ Created index on user_id')
    } else {
      console.log('  ℹ️  user_id index already exists')
    }

    const prefixIdx = await this.indexExists(sql, 'idx_api_keys_key_prefix')
    if (!prefixIdx) {
      await this.exec(sql, `
        CREATE INDEX idx_api_keys_key_prefix ON api_keys(key_prefix)
      `)
      console.log('  ✅ Created index on key_prefix')
    } else {
      console.log('  ℹ️  key_prefix index already exists')
    }

    console.log('🎉 api_keys migration completed!')
  }
}
