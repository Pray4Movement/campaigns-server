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
}

export default class PrayerDurationMigration extends BaseMigration {
  id = 9
  name = 'Add prayer duration to reminder signups'

  async up(sql) {
    console.log('📥 Adding prayer_duration column to reminder_signups...')

    const columnExists = await this.columnExists(sql, 'reminder_signups', 'prayer_duration')
    if (!columnExists) {
      await this.exec(sql, `
        ALTER TABLE reminder_signups
        ADD COLUMN prayer_duration INTEGER DEFAULT 10
      `)
      console.log('  ✅ prayer_duration column added')
    } else {
      console.log('  ℹ️  prayer_duration column already exists')
    }

    console.log('🎉 Prayer duration migration completed successfully!')
  }
}
