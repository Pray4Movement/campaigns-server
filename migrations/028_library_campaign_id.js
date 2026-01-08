class BaseMigration {
  async exec(sql, query) {
    await sql.unsafe(query)
  }

  down(sql) {
    throw new Error(`Down migration not implemented for migration ${this.id}`)
  }
}

export default class LibraryCampaignIdMigration extends BaseMigration {
  id = 28
  name = 'Library Campaign ID'

  async up(sql) {
    console.log('Adding campaign_id and library_key columns to libraries...')

    await this.exec(sql, `
      ALTER TABLE libraries
      ADD COLUMN IF NOT EXISTS campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE
    `)
    console.log('  campaign_id column added')

    await this.exec(sql, `
      ALTER TABLE libraries
      ADD COLUMN IF NOT EXISTS library_key TEXT
    `)
    console.log('  library_key column added')

    await this.exec(sql, `
      CREATE INDEX IF NOT EXISTS idx_libraries_campaign ON libraries(campaign_id)
    `)
    console.log('  idx_libraries_campaign index created')

    await this.exec(sql, `
      CREATE INDEX IF NOT EXISTS idx_libraries_campaign_key ON libraries(campaign_id, library_key)
    `)
    console.log('  idx_libraries_campaign_key index created')
  }
}
