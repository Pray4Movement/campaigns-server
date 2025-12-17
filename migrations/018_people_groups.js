class BaseMigration {
  async exec(sql, query) {
    await sql.unsafe(query)
  }

  down(sql) {
    throw new Error(`Down migration not implemented for migration ${this.id}`)
  }
}

export default class PeopleGroupsMigration extends BaseMigration {
  id = 18
  name = 'People Groups'

  async up(sql) {
    console.log('👥 Creating people_groups table...')

    await this.exec(sql, `
      CREATE TABLE IF NOT EXISTS people_groups (
        id SERIAL PRIMARY KEY,
        dt_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        image_url TEXT,
        metadata TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await this.exec(sql, 'CREATE INDEX IF NOT EXISTS idx_people_groups_name ON people_groups(name)')

    console.log('  ✅ people_groups table created')
  }
}
