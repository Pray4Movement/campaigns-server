class BaseMigration {
  async exec(sql, query) {
    await sql.unsafe(query)
  }

  down(sql) {
    throw new Error(`Down migration not implemented for migration ${this.id}`)
  }
}

export default class PrayerSessionIdMigration extends BaseMigration {
  id = 22
  name = 'Prayer Session ID Column'

  async up(sql) {
    console.log('Adding session_id column to prayer_activity table...')

    await this.exec(sql, `
      ALTER TABLE prayer_activity
      ADD COLUMN IF NOT EXISTS session_id TEXT DEFAULT NULL
    `)

    await this.exec(sql, `
      CREATE UNIQUE INDEX IF NOT EXISTS idx_prayer_activity_session_id
      ON prayer_activity (session_id)
      WHERE session_id IS NOT NULL
    `)

    console.log('  ✅ session_id column and index added')
  }
}
