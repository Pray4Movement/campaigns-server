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

export default class InitialSchemaMigration extends BaseMigration {
  id = 1
  name = 'Initial Schema'

  async up(pool) {
    console.log('📥 Creating initial schema...')

    // Users table (admin users)
    await this.exec(pool, `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        display_name TEXT DEFAULT '' NOT NULL,
        verified BOOLEAN DEFAULT FALSE NOT NULL,
        superadmin BOOLEAN DEFAULT FALSE NOT NULL,
        token_key TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create indexes for faster lookups
    await this.exec(pool, 'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)')
    await this.exec(pool, 'CREATE INDEX IF NOT EXISTS idx_users_token_key ON users(token_key)')

    console.log('  ✅ Users table created')

    // Roles table
    await this.exec(pool, `
      CREATE TABLE IF NOT EXISTS roles (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        description TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // User roles junction table
    await this.exec(pool, `
      CREATE TABLE IF NOT EXISTS user_roles (
        user_id INTEGER NOT NULL,
        role_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, role_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
      )
    `)

    // Permissions table
    await this.exec(pool, `
      CREATE TABLE IF NOT EXISTS permissions (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        description TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Role permissions junction table
    await this.exec(pool, `
      CREATE TABLE IF NOT EXISTS role_permissions (
        role_id INTEGER NOT NULL,
        permission_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (role_id, permission_id),
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
      )
    `)

    console.log('  ✅ Roles and permissions tables created')

    // Campaigns table
    await this.exec(pool, `
      CREATE TABLE IF NOT EXISTS campaigns (
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

    await this.exec(pool, 'CREATE INDEX IF NOT EXISTS idx_campaigns_slug ON campaigns(slug)')
    await this.exec(pool, 'CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status)')

    console.log('  ✅ Campaigns table created')

    // Prayer content table
    await this.exec(pool, `
      CREATE TABLE IF NOT EXISTS prayer_content (
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

    await this.exec(pool, 'CREATE INDEX IF NOT EXISTS idx_prayer_content_campaign_date ON prayer_content(campaign_id, content_date)')
    await this.exec(pool, 'CREATE INDEX IF NOT EXISTS idx_prayer_content_date ON prayer_content(content_date)')
    await this.exec(pool, 'CREATE INDEX IF NOT EXISTS idx_prayer_content_language ON prayer_content(language_code)')

    console.log('  ✅ Prayer content table created')

    // Reminder signups table
    await this.exec(pool, `
      CREATE TABLE IF NOT EXISTS reminder_signups (
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

    await this.exec(pool, 'CREATE INDEX IF NOT EXISTS idx_reminder_signups_campaign ON reminder_signups(campaign_id)')
    await this.exec(pool, 'CREATE INDEX IF NOT EXISTS idx_reminder_signups_tracking_id ON reminder_signups(tracking_id)')
    await this.exec(pool, 'CREATE INDEX IF NOT EXISTS idx_reminder_signups_status ON reminder_signups(status)')

    console.log('  ✅ Reminder signups table created')

    // Prayer activity table
    await this.exec(pool, `
      CREATE TABLE IF NOT EXISTS prayer_activity (
        id SERIAL PRIMARY KEY,
        campaign_id INTEGER NOT NULL,
        tracking_id TEXT DEFAULT NULL,
        duration INTEGER DEFAULT 0,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
      )
    `)

    await this.exec(pool, 'CREATE INDEX IF NOT EXISTS idx_prayer_activity_campaign ON prayer_activity(campaign_id)')
    await this.exec(pool, 'CREATE INDEX IF NOT EXISTS idx_prayer_activity_tracking_id ON prayer_activity(tracking_id)')
    await this.exec(pool, 'CREATE INDEX IF NOT EXISTS idx_prayer_activity_timestamp ON prayer_activity(timestamp)')

    console.log('  ✅ Prayer activity table created')

    console.log('🎉 Initial schema migration completed successfully!')
  }
}
