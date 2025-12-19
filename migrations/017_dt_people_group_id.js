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

export default class DtPeopleGroupIdMigration extends BaseMigration {
  id = 17
  name = 'Add dt_id to campaigns'

  async up(sql) {
    console.log('📥 Adding dt_id column to campaigns...')

    // Add dt_id column
    const columnExists = await this.columnExists(sql, 'campaigns', 'dt_id')
    if (!columnExists) {
      await this.exec(sql, `
        ALTER TABLE campaigns ADD COLUMN dt_id TEXT
      `)
      console.log('  ✅ Added dt_id column')
    } else {
      console.log('  ℹ️  dt_id column already exists')
    }

    // Create index for lookups
    const indexExists = await this.indexExists(sql, 'idx_campaigns_dt_id')
    if (!indexExists) {
      await this.exec(sql, `
        CREATE INDEX idx_campaigns_dt_id ON campaigns(dt_id)
      `)
      console.log('  ✅ Created idx_campaigns_dt_id index')
    } else {
      console.log('  ℹ️  idx_campaigns_dt_id index already exists')
    }

    console.log('🎉 dt_id migration completed!')
  }
}
