class BaseMigration {
  async exec(sql, query) {
    await sql.unsafe(query)
  }
}

export default class RequirePeopleGroupsSlug extends BaseMigration {
  id = 39
  name = 'Require slug on people_groups and backfill nulls'

  async up(sql) {
    console.log('📥 Requiring slug on people_groups...')

    // Generate random slugs for any people groups missing one
    await this.exec(sql, `
      UPDATE people_groups
      SET slug = 'pg-' || substr(md5(random()::text || id::text), 1, 12)
      WHERE slug IS NULL
    `)
    console.log('  ✅ Backfilled random slugs for people groups missing one')

    // Add NOT NULL constraint
    await this.exec(sql, `
      ALTER TABLE people_groups
      ALTER COLUMN slug SET NOT NULL
    `)
    console.log('  ✅ Added NOT NULL constraint to slug')

    console.log('🎉 People groups slug requirement migration completed!')
  }
}
