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

export default class FollowupTrackingMigration extends BaseMigration {
  id = 30
  name = 'Add follow-up tracking for commitment check-ins'

  async up(sql) {
    console.log('📥 Adding follow-up tracking columns and table...')

    // Add columns to campaign_subscriptions
    const lastFollowupAtExists = await this.columnExists(sql, 'campaign_subscriptions', 'last_followup_at')
    if (!lastFollowupAtExists) {
      await this.exec(sql, `
        ALTER TABLE campaign_subscriptions
        ADD COLUMN last_followup_at TIMESTAMP DEFAULT NULL
      `)
      console.log('  ✅ Added last_followup_at column')
    } else {
      console.log('  ℹ️  last_followup_at column already exists')
    }

    const followupCountExists = await this.columnExists(sql, 'campaign_subscriptions', 'followup_count')
    if (!followupCountExists) {
      await this.exec(sql, `
        ALTER TABLE campaign_subscriptions
        ADD COLUMN followup_count INTEGER DEFAULT 0
      `)
      console.log('  ✅ Added followup_count column')
    } else {
      console.log('  ℹ️  followup_count column already exists')
    }

    const followupReminderCountExists = await this.columnExists(sql, 'campaign_subscriptions', 'followup_reminder_count')
    if (!followupReminderCountExists) {
      await this.exec(sql, `
        ALTER TABLE campaign_subscriptions
        ADD COLUMN followup_reminder_count INTEGER DEFAULT 0
      `)
      console.log('  ✅ Added followup_reminder_count column')
    } else {
      console.log('  ℹ️  followup_reminder_count column already exists')
    }

    // Create followup_responses table
    const followupResponsesExists = await this.tableExists(sql, 'followup_responses')
    if (!followupResponsesExists) {
      await this.exec(sql, `
        CREATE TABLE followup_responses (
          id SERIAL PRIMARY KEY,
          subscription_id INTEGER NOT NULL REFERENCES campaign_subscriptions(id) ON DELETE CASCADE,
          response TEXT NOT NULL CHECK (response IN ('committed', 'sometimes', 'not_praying')),
          followup_sent_at TIMESTAMP NOT NULL,
          responded_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
          created_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
        )
      `)
      console.log('  ✅ Created followup_responses table')
    } else {
      console.log('  ℹ️  followup_responses table already exists')
    }

    // Create index on followup_responses
    const indexExists = await this.indexExists(sql, 'idx_followup_responses_subscription')
    if (!indexExists) {
      await this.exec(sql, `
        CREATE INDEX idx_followup_responses_subscription ON followup_responses(subscription_id)
      `)
      console.log('  ✅ Created idx_followup_responses_subscription index')
    }

    console.log('🎉 Follow-up tracking migration completed!')
  }
}
