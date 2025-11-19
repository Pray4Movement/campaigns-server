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

export default class AppConfigMigration extends BaseMigration {
  id = 7
  name = 'App Config'

  async up(pool) {
    console.log('⚙️  Creating app_config table...')

    // App config table for global settings
    await this.exec(pool, `
      CREATE TABLE IF NOT EXISTS app_config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await this.exec(pool, 'CREATE INDEX IF NOT EXISTS idx_app_config_key ON app_config(key)')

    console.log('  ✅ App config table created')
    console.log('🎉 App config migration completed successfully!')
  }
}
