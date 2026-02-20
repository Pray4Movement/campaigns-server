class BaseMigration {
  async exec(sql, query) {
    await sql.unsafe(query)
  }

  async columnExists(sql, tableName, columnName) {
    const result = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = ${tableName}
        AND column_name = ${columnName}
      ) as exists
    `
    return result[0]?.exists || false
  }

  async tableExists(sql, tableName) {
    const result = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = ${tableName}
      ) as exists
    `
    return result[0]?.exists || false
  }

  async constraintExists(sql, tableName, constraintName) {
    const result = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.table_constraints
        WHERE table_schema = 'public'
        AND table_name = ${tableName}
        AND constraint_name = ${constraintName}
      ) as exists
    `
    return result[0]?.exists || false
  }
}

export default class MakeCampaignIdNullable extends BaseMigration {
  id = 37
  name = 'Make campaign_id nullable now that people_group_id is used'

  async up(sql) {
    console.log('📥 Making campaign_id nullable on tables that now use people_group_id...')

    // --- Handle campaign_users specially (campaign_id is in primary key) ---
    if (await this.tableExists(sql, 'campaign_users')) {
      // Drop the old primary key
      const pkName = await sql`
        SELECT constraint_name FROM information_schema.table_constraints
        WHERE table_name = 'campaign_users' AND constraint_type = 'PRIMARY KEY'
      `
      if (pkName.length > 0) {
        await this.exec(sql, `ALTER TABLE campaign_users DROP CONSTRAINT ${pkName[0].constraint_name}`)
        console.log(`  ✅ Dropped primary key on campaign_users`)
      }

      // Make campaign_id nullable
      await this.exec(sql, `ALTER TABLE campaign_users ALTER COLUMN campaign_id DROP NOT NULL`)
      console.log(`  ✅ Made campaign_id nullable on campaign_users`)

      // Add new primary key on (people_group_id, user_id) if both columns exist
      if (await this.columnExists(sql, 'campaign_users', 'people_group_id')) {
        // Make people_group_id NOT NULL for existing rows
        await this.exec(sql, `ALTER TABLE campaign_users ALTER COLUMN people_group_id SET NOT NULL`)
        await this.exec(sql, `ALTER TABLE campaign_users ADD PRIMARY KEY (people_group_id, user_id)`)
        console.log(`  ✅ Added new primary key (people_group_id, user_id) on campaign_users`)
      }
    }

    // --- Handle remaining tables (no PK issues) ---
    const tables = [
      'campaign_subscriptions',
      'campaign_library_config',
      'prayer_content',
      'prayer_activity',
      'reminder_signups',
      'marketing_emails',
      'libraries'
    ]

    for (const table of tables) {
      if (!(await this.tableExists(sql, table))) {
        console.log(`  ⏭️  Skipping ${table} (table does not exist)`)
        continue
      }
      if (!(await this.columnExists(sql, table, 'campaign_id'))) {
        console.log(`  ⏭️  Skipping ${table} (no campaign_id column)`)
        continue
      }
      await this.exec(sql, `ALTER TABLE ${table} ALTER COLUMN campaign_id DROP NOT NULL`)
      console.log(`  ✅ Made campaign_id nullable on ${table}`)
    }

    // Drop the unique constraint on (campaign_id, subscriber_id) in campaign_subscriptions
    const result = await sql`
      SELECT tc.constraint_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name
      WHERE tc.table_name = 'campaign_subscriptions'
      AND tc.constraint_type = 'UNIQUE'
      AND ccu.column_name = 'campaign_id'
    `
    for (const row of result) {
      await this.exec(sql, `ALTER TABLE campaign_subscriptions DROP CONSTRAINT ${row.constraint_name}`)
      console.log(`  ✅ Dropped unique constraint ${row.constraint_name}`)
    }

    console.log('🎉 campaign_id nullable migration completed!')
  }
}
