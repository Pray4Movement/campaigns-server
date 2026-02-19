class BaseMigration {
  async exec(sql, query) {
    await sql.unsafe(query)
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

  async indexExists(sql, indexName) {
    const result = await sql`
      SELECT EXISTS (
        SELECT FROM pg_indexes
        WHERE schemaname = 'public'
        AND indexname = ${indexName}
      ) as exists
    `
    return result[0]?.exists || false
  }
}

export default class MergeCampaignsIntoPeopleGroups extends BaseMigration {
  id = 36
  name = 'Merge campaigns into people_groups'

  async up(sql) {
    console.log('📥 Merging campaigns into people_groups...')

    // --- Step 1: Add people_praying and daily_prayer_duration to people_groups ---

    if (!(await this.columnExists(sql, 'people_groups', 'people_praying'))) {
      await this.exec(sql, `ALTER TABLE people_groups ADD COLUMN people_praying INTEGER DEFAULT 0`)
      console.log('  ✅ Added people_praying to people_groups')
    } else {
      console.log('  ℹ️  people_praying already exists on people_groups')
    }

    if (!(await this.columnExists(sql, 'people_groups', 'daily_prayer_duration'))) {
      await this.exec(sql, `ALTER TABLE people_groups ADD COLUMN daily_prayer_duration INTEGER DEFAULT 0`)
      console.log('  ✅ Added daily_prayer_duration to people_groups')
    } else {
      console.log('  ℹ️  daily_prayer_duration already exists on people_groups')
    }

    // --- Step 2: Add people_group_id columns to all referencing tables ---

    const tablesToUpdate = [
      'campaign_subscriptions',
      'campaign_library_config',
      'campaign_users',
      'prayer_content',
      'prayer_activity',
      'reminder_signups',
      'marketing_emails',
      'libraries'
    ]

    for (const table of tablesToUpdate) {
      if (!(await this.tableExists(sql, table))) {
        console.log(`  ⏭️  Skipping ${table} (table does not exist)`)
        continue
      }
      if (!(await this.columnExists(sql, table, 'people_group_id'))) {
        await this.exec(sql, `ALTER TABLE ${table} ADD COLUMN people_group_id INTEGER REFERENCES people_groups(id)`)
        console.log(`  ✅ Added people_group_id to ${table}`)
      } else {
        console.log(`  ℹ️  people_group_id already exists on ${table}`)
      }
    }

    // Add consented_people_group_ids and consented_people_group_ids_at to contact_methods
    if (!(await this.columnExists(sql, 'contact_methods', 'consented_people_group_ids'))) {
      await this.exec(sql, `ALTER TABLE contact_methods ADD COLUMN consented_people_group_ids INTEGER[] DEFAULT '{}'`)
      console.log('  ✅ Added consented_people_group_ids to contact_methods')
    } else {
      console.log('  ℹ️  consented_people_group_ids already exists on contact_methods')
    }

    if (!(await this.columnExists(sql, 'contact_methods', 'consented_people_group_ids_at'))) {
      await this.exec(sql, `ALTER TABLE contact_methods ADD COLUMN consented_people_group_ids_at JSONB DEFAULT '{}'`)
      console.log('  ✅ Added consented_people_group_ids_at to contact_methods')
    } else {
      console.log('  ℹ️  consented_people_group_ids_at already exists on contact_methods')
    }

    // --- Step 3: Backfill data ---

    // Backfill people_groups fields from campaigns
    await this.exec(sql, `
      UPDATE people_groups pg SET
        people_praying = COALESCE(c.people_praying, 0),
        daily_prayer_duration = COALESCE(c.daily_prayer_duration, 0)
      FROM campaigns c WHERE pg.dt_id = c.dt_id
    `)
    console.log('  ✅ Backfilled people_praying and daily_prayer_duration on people_groups')

    // Backfill people_group_id in each table
    for (const table of tablesToUpdate) {
      if (!(await this.tableExists(sql, table))) continue
      await this.exec(sql, `
        UPDATE ${table} t SET people_group_id = pg.id
        FROM campaigns c JOIN people_groups pg ON pg.dt_id = c.dt_id
        WHERE t.campaign_id = c.id AND t.people_group_id IS NULL
      `)
      console.log(`  ✅ Backfilled people_group_id in ${table}`)
    }

    // Backfill consented_people_group_ids in contact_methods
    // Map each campaign_id in the consented_campaign_ids array to the corresponding people_group_id
    if (await this.columnExists(sql, 'contact_methods', 'consented_campaign_ids')) {
      await this.exec(sql, `
        UPDATE contact_methods cm SET
          consented_people_group_ids = (
            SELECT COALESCE(ARRAY_AGG(pg.id), '{}')
            FROM UNNEST(cm.consented_campaign_ids) AS cid
            JOIN campaigns c ON c.id = cid
            JOIN people_groups pg ON pg.dt_id = c.dt_id
          ),
          consented_people_group_ids_at = (
            SELECT COALESCE(
              jsonb_object_agg(pg.id::text, cm.consented_campaign_ids_at->>c.id::text),
              '{}'::jsonb
            )
            FROM UNNEST(cm.consented_campaign_ids) AS cid
            JOIN campaigns c ON c.id = cid
            JOIN people_groups pg ON pg.dt_id = c.dt_id
            WHERE cm.consented_campaign_ids_at->>c.id::text IS NOT NULL
          )
        WHERE ARRAY_LENGTH(cm.consented_campaign_ids, 1) > 0
      `)
      console.log('  ✅ Backfilled consented_people_group_ids in contact_methods')
    } else {
      console.log('  ⏭️  Skipping consented_people_group_ids backfill (consented_campaign_ids column does not exist)')
    }

    // --- Step 4: Create indexes ---

    const indexes = [
      { name: 'idx_campaign_subscriptions_people_group_id', table: 'campaign_subscriptions', column: 'people_group_id' },
      { name: 'idx_campaign_library_config_people_group_id', table: 'campaign_library_config', column: 'people_group_id' },
      { name: 'idx_campaign_users_people_group_id', table: 'campaign_users', column: 'people_group_id' },
      { name: 'idx_prayer_content_people_group_id', table: 'prayer_content', column: 'people_group_id' },
      { name: 'idx_prayer_activity_people_group_id', table: 'prayer_activity', column: 'people_group_id' },
      { name: 'idx_reminder_signups_people_group_id', table: 'reminder_signups', column: 'people_group_id' },
      { name: 'idx_marketing_emails_people_group_id', table: 'marketing_emails', column: 'people_group_id' },
      { name: 'idx_libraries_people_group_id', table: 'libraries', column: 'people_group_id' }
    ]

    for (const idx of indexes) {
      if (!(await this.tableExists(sql, idx.table))) continue
      if (!(await this.indexExists(sql, idx.name))) {
        await this.exec(sql, `CREATE INDEX ${idx.name} ON ${idx.table}(${idx.column})`)
        console.log(`  ✅ Created index ${idx.name}`)
      } else {
        console.log(`  ℹ️  Index ${idx.name} already exists`)
      }
    }

    console.log('🎉 Merge campaigns into people_groups migration completed!')
  }
}
