class BaseMigration {
  async exec(sql, query) {
    await sql.unsafe(query)
  }
}

export default class RemoveTitleFromLibraryContent extends BaseMigration {
  id = 6
  name = 'Remove Title from Library Content'

  async up(sql) {
    console.log('📝 Removing title column from library_content table...')

    // Remove the title column
    await this.exec(sql, `
      ALTER TABLE library_content
      DROP COLUMN IF EXISTS title
    `)

    console.log('  ✅ Title column removed from library_content')
    console.log('🎉 Migration completed successfully!')
  }
}
