class BaseMigration {
  async exec(sql, query) {
    await sql.unsafe(query)
  }

  down(sql) {
    throw new Error(`Down migration not implemented for migration ${this.id}`)
  }
}

export default class DailyPrayerDurationMigration extends BaseMigration {
  id = 23
  name = 'Daily Prayer Duration Column'

  async up(sql) {
    console.log('Adding daily_prayer_duration column to campaigns table...')

    await this.exec(sql, `
      ALTER TABLE campaigns
      ADD COLUMN IF NOT EXISTS daily_prayer_duration INTEGER DEFAULT 0 NOT NULL
    `)

    console.log('  ✅ daily_prayer_duration column added')
  }
}
