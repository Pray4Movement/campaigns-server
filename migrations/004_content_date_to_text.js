class BaseMigration {
  async exec(sql, query) {
    await sql.unsafe(query)
  }
}

export default class ContentDateToTextMigration extends BaseMigration {
  id = 4
  name = 'Change content_date from DATE to TEXT'

  async up(sql) {
    console.log('📥 Changing content_date column from DATE to TEXT...')

    // Alter the column type from DATE to TEXT
    await this.exec(sql, `
      ALTER TABLE prayer_content
      ALTER COLUMN content_date TYPE TEXT USING content_date::text
    `)

    console.log('  ✅ content_date column changed to TEXT')
    console.log('🎉 Content date migration completed successfully!')
  }
}
