class BaseMigration {
  async exec(sql, query) {
    await sql.unsafe(query)
  }
}

export default class AppConfigMigration extends BaseMigration {
  id = 7
  name = 'App Config'

  async up(sql) {
    console.log('⚙️  Creating app_config table...')

    // App config table for global settings
    await this.exec(sql, `
      CREATE TABLE IF NOT EXISTS app_config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await this.exec(sql, 'CREATE INDEX IF NOT EXISTS idx_app_config_key ON app_config(key)')

    console.log('  ✅ App config table created')
    console.log('🎉 App config migration completed successfully!')
  }
}
