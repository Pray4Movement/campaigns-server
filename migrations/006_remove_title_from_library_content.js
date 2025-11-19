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

export default class RemoveTitleFromLibraryContent extends BaseMigration {
  id = 6
  name = 'Remove Title from Library Content'

  async up(pool) {
    console.log('📝 Removing title column from library_content table...')

    // Remove the title column
    await this.exec(pool, `
      ALTER TABLE library_content
      DROP COLUMN IF EXISTS title
    `)

    console.log('  ✅ Title column removed from library_content')
    console.log('🎉 Migration completed successfully!')
  }
}
