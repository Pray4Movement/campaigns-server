class BaseMigration {
  async exec(sql, query) {
    await sql.unsafe(query)
  }

  down(sql) {
    throw new Error(`Down migration not implemented for migration ${this.id}`)
  }
}

export default class PrayerContentDateMigration extends BaseMigration {
  id = 27
  name = 'Prayer Content Date Column'

  async up(sql) {
    console.log('Adding content_date column to prayer_activity table...')

    await this.exec(sql, `
      ALTER TABLE prayer_activity
      ADD COLUMN IF NOT EXISTS content_date DATE DEFAULT NULL
    `)

    await this.exec(sql, `
      CREATE INDEX IF NOT EXISTS idx_prayer_activity_content_date
      ON prayer_activity (content_date)
    `)

    console.log('  ✅ content_date column and index added')
  }
}
