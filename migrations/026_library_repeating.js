class BaseMigration {
  async exec(sql, query) {
    await sql.unsafe(query)
  }

  down(sql) {
    throw new Error(`Down migration not implemented for migration ${this.id}`)
  }
}

export default class LibraryRepeatingMigration extends BaseMigration {
  id = 26
  name = 'Library Repeating'

  async up(sql) {
    console.log('Adding repeating column to libraries...')

    await this.exec(sql, `
      ALTER TABLE libraries
      ADD COLUMN IF NOT EXISTS repeating BOOLEAN DEFAULT false
    `)

    console.log('  repeating column added')
  }
}
