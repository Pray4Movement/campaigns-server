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

export default class ReminderTrackingAndTimezoneMigration extends BaseMigration {
  id = 10
  name = 'Add timezone and reminder tracking'

  async up(sql) {
    console.log('📥 Adding timezone and reminder tracking...')

    // Add timezone column to reminder_signups
    const timezoneExists = await this.columnExists(sql, 'reminder_signups', 'timezone')
    if (!timezoneExists) {
      await this.exec(sql, `
        ALTER TABLE reminder_signups
        ADD COLUMN timezone TEXT DEFAULT 'UTC'
      `)
      console.log('  ✅ timezone column added')
    } else {
      console.log('  ℹ️  timezone column already exists')
    }

    // Add next_reminder_utc column to reminder_signups
    const nextReminderExists = await this.columnExists(sql, 'reminder_signups', 'next_reminder_utc')
    if (!nextReminderExists) {
      await this.exec(sql, `
        ALTER TABLE reminder_signups
        ADD COLUMN next_reminder_utc TIMESTAMP
      `)
      console.log('  ✅ next_reminder_utc column added')
    } else {
      console.log('  ℹ️  next_reminder_utc column already exists')
    }

    // Create index for efficient scheduler queries
    const indexExists = await this.indexExists(sql, 'idx_reminder_signups_next_reminder')
    if (!indexExists) {
      await this.exec(sql, `
        CREATE INDEX idx_reminder_signups_next_reminder
        ON reminder_signups(next_reminder_utc)
        WHERE status = 'active' AND email_verified = true AND delivery_method = 'email'
      `)
      console.log('  ✅ next_reminder_utc index created')
    } else {
      console.log('  ℹ️  next_reminder_utc index already exists')
    }

    // Create reminder_emails_sent table
    const tableExists = await this.tableExists(sql, 'reminder_emails_sent')
    if (!tableExists) {
      await this.exec(sql, `
        CREATE TABLE reminder_emails_sent (
          id SERIAL PRIMARY KEY,
          signup_id INTEGER NOT NULL REFERENCES reminder_signups(id) ON DELETE CASCADE,
          sent_date TEXT NOT NULL,
          sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(signup_id, sent_date)
        )
      `)
      console.log('  ✅ reminder_emails_sent table created')

      await this.exec(sql, `
        CREATE INDEX idx_reminder_emails_sent_date ON reminder_emails_sent(sent_date)
      `)
      console.log('  ✅ reminder_emails_sent date index created')
    } else {
      console.log('  ℹ️  reminder_emails_sent table already exists')
    }

    console.log('🎉 Reminder tracking and timezone migration completed successfully!')
  }
}
