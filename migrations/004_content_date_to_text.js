class BaseMigration {
  async exec(pool, sql) {
    await pool.query(sql)
  }

  async query(pool, sql, params = []) {
    const result = await pool.query(sql, params)
    return result.rows
  }

  down(pool) {
    throw new Error(`Down migration not implemented for migration ${this.id}`)
  }
}

export default class ContentDateToTextMigration extends BaseMigration {
  id = 4
  name = 'Change content_date from DATE to TEXT'

  async up(pool) {
    console.log('📥 Changing content_date column from DATE to TEXT...')

    // Alter the column type from DATE to TEXT
    await this.exec(pool, `
      ALTER TABLE prayer_content
      ALTER COLUMN content_date TYPE TEXT USING content_date::text
    `)

    console.log('  ✅ content_date column changed to TEXT')
    console.log('🎉 Content date migration completed successfully!')
  }
}
