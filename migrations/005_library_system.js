class BaseMigration {
  async exec(sql, query) {
    await sql.unsafe(query)
  }
}

export default class LibrarySystemMigration extends BaseMigration {
  id = 5
  name = 'Library System'

  async up(sql) {
    console.log('📚 Creating library system tables...')

    // Libraries table
    await this.exec(sql, `
      CREATE TABLE IF NOT EXISTS libraries (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        description TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await this.exec(sql, 'CREATE INDEX IF NOT EXISTS idx_libraries_name ON libraries(name)')

    console.log('  ✅ Libraries table created')

    // Library content table
    await this.exec(sql, `
      CREATE TABLE IF NOT EXISTS library_content (
        id SERIAL PRIMARY KEY,
        library_id INTEGER NOT NULL,
        day_number INTEGER NOT NULL,
        language_code TEXT DEFAULT 'en' NOT NULL,
        title TEXT NOT NULL,
        content_json TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (library_id) REFERENCES libraries(id) ON DELETE CASCADE,
        UNIQUE(library_id, day_number, language_code)
      )
    `)

    await this.exec(sql, 'CREATE INDEX IF NOT EXISTS idx_library_content_library_day ON library_content(library_id, day_number)')
    await this.exec(sql, 'CREATE INDEX IF NOT EXISTS idx_library_content_day ON library_content(day_number)')
    await this.exec(sql, 'CREATE INDEX IF NOT EXISTS idx_library_content_language ON library_content(language_code)')

    console.log('  ✅ Library content table created')

    // Campaign library configuration table
    await this.exec(sql, `
      CREATE TABLE IF NOT EXISTS campaign_library_config (
        id SERIAL PRIMARY KEY,
        campaign_id INTEGER NOT NULL,
        library_id INTEGER NOT NULL,
        order_index INTEGER NOT NULL,
        enabled BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
        FOREIGN KEY (library_id) REFERENCES libraries(id) ON DELETE CASCADE,
        UNIQUE(campaign_id, library_id)
      )
    `)

    await this.exec(sql, 'CREATE INDEX IF NOT EXISTS idx_campaign_library_config_campaign ON campaign_library_config(campaign_id)')
    await this.exec(sql, 'CREATE INDEX IF NOT EXISTS idx_campaign_library_config_library ON campaign_library_config(library_id)')
    await this.exec(sql, 'CREATE INDEX IF NOT EXISTS idx_campaign_library_config_order ON campaign_library_config(campaign_id, order_index)')

    console.log('  ✅ Campaign library config table created')

    console.log('🎉 Library system migration completed successfully!')
  }
}
