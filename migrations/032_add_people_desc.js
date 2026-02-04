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

export default class AddPeopleDescMigration extends BaseMigration {
  id = 32
  name = 'Add people_desc column to people_groups'

  async up(sql) {
    console.log('📥 Adding people_desc column to people_groups...')

    const peopleDescExists = await this.columnExists(sql, 'people_groups', 'people_desc')
    if (!peopleDescExists) {
      await this.exec(sql, `
        ALTER TABLE people_groups
        ADD COLUMN people_desc TEXT
      `)
      console.log('  ✅ Added people_desc column')
    } else {
      console.log('  ℹ️  people_desc column already exists')
    }

    console.log('🎉 People desc migration completed!')
  }
}
