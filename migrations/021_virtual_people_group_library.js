class BaseMigration {
  async exec(sql, query) {
    await sql.unsafe(query)
  }

  down(sql) {
    throw new Error(`Down migration not implemented for migration ${this.id}`)
  }
}

export default class VirtualPeopleGroupLibraryMigration extends BaseMigration {
  id = 21
  name = 'Virtual People Group Library'

  async up(sql) {
    console.log('Migrating People Group library to virtual...')

    // Find the existing people_group library ID
    const existing = await sql`SELECT id FROM libraries WHERE type = 'people_group' LIMIT 1`

    if (existing.length > 0) {
      const oldLibraryId = existing[0].id
      console.log(`  Found existing people_group library with ID: ${oldLibraryId}`)

      // Update global_campaign_libraries config to use virtual ID (-1)
      const configResult = await sql`
        SELECT value FROM app_config WHERE key = 'global_campaign_libraries'
      `

      if (configResult.length > 0 && configResult[0].value) {
        try {
          const config = configResult[0].value
          let updated = false

          // Update any references to the old library ID with -1
          if (config.rows && Array.isArray(config.rows)) {
            for (const row of config.rows) {
              if (row.libraries && Array.isArray(row.libraries)) {
                for (const lib of row.libraries) {
                  if (lib.libraryId === oldLibraryId) {
                    lib.libraryId = -1
                    updated = true
                  }
                }
              }
            }
          }

          if (updated) {
            await sql`
              UPDATE app_config
              SET value = ${JSON.stringify(config)}
              WHERE key = 'global_campaign_libraries'
            `
            console.log('  Updated global_campaign_libraries config to use virtual ID (-1)')
          } else {
            console.log('  No config references to update')
          }
        } catch (e) {
          console.log('  Error parsing config, skipping config update:', e.message)
        }
      }

      // Delete the old people_group library from the database
      await sql`DELETE FROM libraries WHERE type = 'people_group'`
      console.log('  Deleted people_group library from database')
    } else {
      console.log('  No existing people_group library found in database')
    }

    console.log('  Migration completed')
  }
}
