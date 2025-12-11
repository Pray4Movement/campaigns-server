class BaseMigration {
  async exec(sql, query) {
    await sql.unsafe(query)
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

export default class AllowMultipleSubscriptionsMigration extends BaseMigration {
  id = 13
  name = 'Allow multiple subscriptions per subscriber per campaign'

  async up(sql) {
    console.log('📥 Allowing multiple subscriptions per subscriber per campaign...')

    // Drop the unique constraint on (campaign_id, subscriber_id)
    const constraintExists = await this.constraintExists(sql, 'campaign_subscriptions', 'campaign_subscriptions_campaign_id_subscriber_id_key')
    if (constraintExists) {
      await this.exec(sql, `
        ALTER TABLE campaign_subscriptions
        DROP CONSTRAINT campaign_subscriptions_campaign_id_subscriber_id_key
      `)
      console.log('  ✅ Dropped unique constraint on (campaign_id, subscriber_id)')
    } else {
      console.log('  ℹ️  Unique constraint already removed')
    }

    // Create an index for efficient lookups (non-unique)
    const indexExists = await this.indexExists(sql, 'idx_campaign_subscriptions_campaign_subscriber')
    if (!indexExists) {
      await this.exec(sql, `
        CREATE INDEX idx_campaign_subscriptions_campaign_subscriber
        ON campaign_subscriptions(campaign_id, subscriber_id)
      `)
      console.log('  ✅ Created non-unique index on (campaign_id, subscriber_id)')
    }

    console.log('🎉 Multiple subscriptions per campaign now allowed!')
  }
}
