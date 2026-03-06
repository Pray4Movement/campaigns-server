class BaseMigration {
  async exec(sql, query) {
    await sql.unsafe(query)
  }
}

export default class AdoptionExtraFieldsMigration extends BaseMigration {
  id = 49
  name = 'Add role to contacts, country to groups'

  async up(sql) {
    await this.exec(sql, `ALTER TABLE contacts ADD COLUMN IF NOT EXISTS role TEXT`)
    await this.exec(sql, `ALTER TABLE groups ADD COLUMN IF NOT EXISTS country TEXT`)
  }
}
