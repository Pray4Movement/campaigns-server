class BaseMigration {
  async exec(sql, query) {
    await sql.unsafe(query)
  }

  down(sql) {
    throw new Error(`Down migration not implemented for migration ${this.id}`)
  }
}

export default class PeoplePrayingMigration extends BaseMigration {
  id = 20
  name = 'People Praying Column'

  async up(sql) {
    console.log('Adding people_praying column to campaigns table...')

    await this.exec(sql, `
      ALTER TABLE campaigns
      ADD COLUMN IF NOT EXISTS people_praying INTEGER DEFAULT 0 NOT NULL
    `)

    console.log('  ✅ people_praying column added')
  }
}
