class BaseMigration {
  async exec(sql, query) {
    await sql.unsafe(query)
  }
}

export default class ContactsMigration extends BaseMigration {
  id = 44
  name = 'Create contacts table'

  async up(sql) {
    await this.exec(sql, `
      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email_address TEXT,
        phone TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await this.exec(sql, 'CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email_address)')
    await this.exec(sql, 'CREATE INDEX IF NOT EXISTS idx_contacts_name ON contacts(name)')
  }
}
