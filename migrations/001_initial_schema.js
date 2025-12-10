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
}

export default class InitialSchemaMigration extends BaseMigration {
  id = 1
  name = 'Initial Schema'

  async up(sql) {
    console.log('📥 Creating project-specific schema...')
    console.log('  ℹ️  Users table provided by base layer')

    // Add role column to users table (simple role management)
    const roleExists = await this.columnExists(sql, 'users', 'role')
    if (!roleExists) {
      await this.exec(sql, `
        ALTER TABLE users
        ADD COLUMN role TEXT DEFAULT NULL
        CHECK(role IN ('admin', 'campaign_editor'))
      `)
      console.log('  ✅ Role column added to users table')
    }

    await this.exec(sql, 'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)')

    // Campaigns table
    const campaignsExists = await this.tableExists(sql, 'campaigns')
    if (!campaignsExists) {
      await this.exec(sql, `
        CREATE TABLE campaigns (
          id SERIAL PRIMARY KEY,
          slug TEXT UNIQUE NOT NULL,
          title TEXT NOT NULL,
          description TEXT DEFAULT '',
          status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
          default_language TEXT DEFAULT 'en' NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)
      console.log('  ✅ Campaigns table created')
    }

    await this.exec(sql, 'CREATE INDEX IF NOT EXISTS idx_campaigns_slug ON campaigns(slug)')
    await this.exec(sql, 'CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status)')

    // Prayer content table
    const prayerContentExists = await this.tableExists(sql, 'prayer_content')
    if (!prayerContentExists) {
      await this.exec(sql, `
        CREATE TABLE prayer_content (
          id SERIAL PRIMARY KEY,
          campaign_id INTEGER NOT NULL,
          content_date TEXT NOT NULL,
          language_code TEXT DEFAULT 'en' NOT NULL,
          title TEXT NOT NULL,
          content_json TEXT DEFAULT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
          UNIQUE(campaign_id, content_date, language_code)
        )
      `)
      console.log('  ✅ Prayer content table created')
    }

    await this.exec(sql, 'CREATE INDEX IF NOT EXISTS idx_prayer_content_campaign_date ON prayer_content(campaign_id, content_date)')
    await this.exec(sql, 'CREATE INDEX IF NOT EXISTS idx_prayer_content_date ON prayer_content(content_date)')
    await this.exec(sql, 'CREATE INDEX IF NOT EXISTS idx_prayer_content_language ON prayer_content(language_code)')

    // Reminder signups table
    const reminderSignupsExists = await this.tableExists(sql, 'reminder_signups')
    if (!reminderSignupsExists) {
      await this.exec(sql, `
        CREATE TABLE reminder_signups (
          id SERIAL PRIMARY KEY,
          campaign_id INTEGER NOT NULL,
          tracking_id TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          email TEXT DEFAULT '',
          phone TEXT DEFAULT '',
          delivery_method TEXT NOT NULL CHECK(delivery_method IN ('email', 'whatsapp', 'app')),
          frequency TEXT NOT NULL,
          days_of_week TEXT DEFAULT NULL,
          time_preference TEXT NOT NULL,
          status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'unsubscribed')),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
        )
      `)
      console.log('  ✅ Reminder signups table created')
    }

    await this.exec(sql, 'CREATE INDEX IF NOT EXISTS idx_reminder_signups_campaign ON reminder_signups(campaign_id)')
    await this.exec(sql, 'CREATE INDEX IF NOT EXISTS idx_reminder_signups_tracking_id ON reminder_signups(tracking_id)')
    await this.exec(sql, 'CREATE INDEX IF NOT EXISTS idx_reminder_signups_status ON reminder_signups(status)')

    // Prayer activity table
    const prayerActivityExists = await this.tableExists(sql, 'prayer_activity')
    if (!prayerActivityExists) {
      await this.exec(sql, `
        CREATE TABLE prayer_activity (
          id SERIAL PRIMARY KEY,
          campaign_id INTEGER NOT NULL,
          tracking_id TEXT DEFAULT NULL,
          duration INTEGER DEFAULT 0,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
        )
      `)
      console.log('  ✅ Prayer activity table created')
    }

    await this.exec(sql, 'CREATE INDEX IF NOT EXISTS idx_prayer_activity_campaign ON prayer_activity(campaign_id)')
    await this.exec(sql, 'CREATE INDEX IF NOT EXISTS idx_prayer_activity_tracking_id ON prayer_activity(tracking_id)')
    await this.exec(sql, 'CREATE INDEX IF NOT EXISTS idx_prayer_activity_timestamp ON prayer_activity(timestamp)')

    console.log('🎉 Initial schema migration completed successfully!')
  }
}
