class BaseMigration {
  async exec(sql, query) {
    await sql.unsafe(query)
  }

  down(sql) {
    throw new Error(`Down migration not implemented for migration ${this.id}`)
  }
}

export default class PeopleGroupRandomOrderMigration extends BaseMigration {
  id = 25
  name = 'People Group Random Order'

  async up(sql) {
    console.log('Adding random_order column to people_groups...')

    // Add the random_order column
    await this.exec(sql, `
      ALTER TABLE people_groups
      ADD COLUMN IF NOT EXISTS random_order INTEGER
    `)

    // Get all people group IDs
    const peopleGroups = await sql`SELECT id FROM people_groups ORDER BY id`

    if (peopleGroups.length > 0) {
      console.log(`  Assigning random order to ${peopleGroups.length} people groups...`)

      // Create array of IDs and shuffle them
      const ids = peopleGroups.map(pg => pg.id)
      const shuffled = this.shuffleArray([...ids])

      // Update each people group with its position in the shuffled array
      for (let i = 0; i < shuffled.length; i++) {
        const randomOrder = i + 1 // 1-indexed
        await sql`
          UPDATE people_groups
          SET random_order = ${randomOrder}
          WHERE id = ${shuffled[i]}
        `
      }

      console.log(`  Assigned random_order 1-${shuffled.length} to people groups`)
    }

    // Add unique index on random_order
    await this.exec(sql, `
      CREATE UNIQUE INDEX IF NOT EXISTS idx_people_groups_random_order
      ON people_groups(random_order)
    `)

    console.log('  random_order column added and populated')
  }

  // Fisher-Yates shuffle
  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[array[i], array[j]] = [array[j], array[i]]
    }
    return array
  }
}
