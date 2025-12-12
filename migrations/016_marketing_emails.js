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

export default class MarketingEmailsMigration extends BaseMigration {
  id = 16
  name = 'Create marketing emails and queue tables'

  async up(sql) {
    console.log('📥 Creating marketing emails tables...')

    // Create marketing_emails table
    const emailsExists = await this.tableExists(sql, 'marketing_emails')
    if (!emailsExists) {
      await this.exec(sql, `
        CREATE TABLE marketing_emails (
          id SERIAL PRIMARY KEY,
          subject TEXT NOT NULL,
          content_json TEXT NOT NULL,
          audience_type TEXT NOT NULL CHECK (audience_type IN ('doxa', 'campaign')),
          campaign_id INTEGER REFERENCES campaigns(id) ON DELETE SET NULL,
          status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'queued', 'sending', 'sent', 'failed')),
          created_by UUID NOT NULL REFERENCES users(id),
          updated_by UUID REFERENCES users(id),
          created_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
          updated_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
          sent_at TIMESTAMP,
          recipient_count INTEGER DEFAULT 0,
          sent_count INTEGER DEFAULT 0,
          failed_count INTEGER DEFAULT 0
        )
      `)
      console.log('  ✅ Created marketing_emails table')
    } else {
      console.log('  ℹ️  marketing_emails table already exists')
    }

    // Create indexes for marketing_emails
    const statusIndexExists = await this.indexExists(sql, 'idx_marketing_emails_status')
    if (!statusIndexExists) {
      await this.exec(sql, `
        CREATE INDEX idx_marketing_emails_status ON marketing_emails(status)
      `)
      console.log('  ✅ Created idx_marketing_emails_status index')
    }

    const audienceIndexExists = await this.indexExists(sql, 'idx_marketing_emails_audience')
    if (!audienceIndexExists) {
      await this.exec(sql, `
        CREATE INDEX idx_marketing_emails_audience ON marketing_emails(audience_type, campaign_id)
      `)
      console.log('  ✅ Created idx_marketing_emails_audience index')
    }

    const createdByIndexExists = await this.indexExists(sql, 'idx_marketing_emails_created_by')
    if (!createdByIndexExists) {
      await this.exec(sql, `
        CREATE INDEX idx_marketing_emails_created_by ON marketing_emails(created_by)
      `)
      console.log('  ✅ Created idx_marketing_emails_created_by index')
    }

    // Create marketing_email_queue table
    const queueExists = await this.tableExists(sql, 'marketing_email_queue')
    if (!queueExists) {
      await this.exec(sql, `
        CREATE TABLE marketing_email_queue (
          id SERIAL PRIMARY KEY,
          marketing_email_id INTEGER NOT NULL REFERENCES marketing_emails(id) ON DELETE CASCADE,
          contact_method_id INTEGER NOT NULL REFERENCES contact_methods(id) ON DELETE CASCADE,
          recipient_email TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
          attempts INTEGER DEFAULT 0,
          last_attempt_at TIMESTAMP,
          error_message TEXT,
          sent_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
        )
      `)
      console.log('  ✅ Created marketing_email_queue table')
    } else {
      console.log('  ℹ️  marketing_email_queue table already exists')
    }

    // Create indexes for queue
    const pendingIndexExists = await this.indexExists(sql, 'idx_marketing_queue_pending')
    if (!pendingIndexExists) {
      await this.exec(sql, `
        CREATE INDEX idx_marketing_queue_pending ON marketing_email_queue(status) WHERE status = 'pending'
      `)
      console.log('  ✅ Created idx_marketing_queue_pending index')
    }

    const queueEmailIndexExists = await this.indexExists(sql, 'idx_marketing_queue_email')
    if (!queueEmailIndexExists) {
      await this.exec(sql, `
        CREATE INDEX idx_marketing_queue_email ON marketing_email_queue(marketing_email_id)
      `)
      console.log('  ✅ Created idx_marketing_queue_email index')
    }

    console.log('🎉 Marketing emails migration completed!')
  }
}
