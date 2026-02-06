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

export default class AddPeopleGroupsSlugMigration extends BaseMigration {
  id = 34
  name = 'Add slug column to people_groups'

  async up(sql) {
    console.log('📥 Adding slug column to people_groups...')

    // Add slug column
    const slugExists = await this.columnExists(sql, 'people_groups', 'slug')
    if (!slugExists) {
      await this.exec(sql, `
        ALTER TABLE people_groups
        ADD COLUMN slug TEXT
      `)
      console.log('  ✅ Added slug column')
    } else {
      console.log('  ℹ️  slug column already exists')
    }

    // Populate slug from linked campaigns (via dt_id)
    console.log('  📦 Populating slug from campaigns...')
    await this.exec(sql, `
      UPDATE people_groups pg
      SET slug = c.slug
      FROM campaigns c
      WHERE pg.dt_id = c.dt_id
        AND c.slug IS NOT NULL
        AND pg.slug IS NULL
    `)
    console.log('  ✅ Populated slug from campaigns')

    // Create unique index
    const indexExists = await this.indexExists(sql, 'idx_people_groups_slug')
    if (!indexExists) {
      await this.exec(sql, `
        CREATE UNIQUE INDEX idx_people_groups_slug ON people_groups(slug)
      `)
      console.log('  ✅ Created unique index on slug')
    } else {
      console.log('  ℹ️  Index already exists')
    }

    console.log('🎉 People groups slug migration completed!')
  }
}
