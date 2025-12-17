class BaseMigration {
  async exec(sql, query) {
    await sql.unsafe(query)
  }

  down(sql) {
    throw new Error(`Down migration not implemented for migration ${this.id}`)
  }
}

export default class LibraryTypeMigration extends BaseMigration {
  id = 19
  name = 'Library Type'

  async up(sql) {
    console.log('Adding type column to libraries table...')

    // Add type column with default 'static' for existing libraries
    await this.exec(sql, `
      ALTER TABLE libraries
      ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'static' NOT NULL
    `)

    console.log('  type column added')

    // Create the system "People Group" library
    const existing = await sql`SELECT id FROM libraries WHERE type = 'people_group' LIMIT 1`

    if (existing.length === 0) {
      await sql`
        INSERT INTO libraries (name, description, type)
        VALUES ('People Group', 'Dynamically displays the linked people group information for the campaign', 'people_group')
      `
      console.log('  People Group library created')
    } else {
      console.log('  People Group library already exists')
    }

    console.log('  Migration completed')
  }
}
