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

export default class JobQueueMigration extends BaseMigration {
  id = 29
  name = 'Create general jobs queue table'

  async up(sql) {
    console.log('📥 Creating jobs table...')

    const exists = await this.tableExists(sql, 'jobs')
    if (!exists) {
      await this.exec(sql, `
        CREATE TABLE jobs (
          id SERIAL PRIMARY KEY,
          type TEXT NOT NULL,
          reference_type TEXT,
          reference_id INTEGER,
          payload JSONB NOT NULL DEFAULT '{}',
          status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
          priority INTEGER NOT NULL DEFAULT 0,
          scheduled_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
          attempts INTEGER DEFAULT 0,
          max_attempts INTEGER DEFAULT 3,
          last_attempt_at TIMESTAMP,
          error_message TEXT,
          result JSONB,
          completed_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
          updated_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
        )
      `)
      console.log('  ✅ Created jobs table')
    } else {
      console.log('  ℹ️  jobs table already exists')
    }

    const pendingIndexExists = await this.indexExists(sql, 'idx_jobs_pending')
    if (!pendingIndexExists) {
      await this.exec(sql, `
        CREATE INDEX idx_jobs_pending ON jobs(type, priority DESC, scheduled_at)
          WHERE status = 'pending'
      `)
      console.log('  ✅ Created idx_jobs_pending index')
    }

    const referenceIndexExists = await this.indexExists(sql, 'idx_jobs_reference')
    if (!referenceIndexExists) {
      await this.exec(sql, `
        CREATE INDEX idx_jobs_reference ON jobs(reference_type, reference_id)
      `)
      console.log('  ✅ Created idx_jobs_reference index')
    }

    const statusIndexExists = await this.indexExists(sql, 'idx_jobs_status')
    if (!statusIndexExists) {
      await this.exec(sql, `
        CREATE INDEX idx_jobs_status ON jobs(status)
      `)
      console.log('  ✅ Created idx_jobs_status index')
    }

    const oldQueueExists = await this.tableExists(sql, 'marketing_email_queue')
    if (oldQueueExists) {
      await this.exec(sql, `DROP TABLE marketing_email_queue`)
      console.log('  ✅ Dropped old marketing_email_queue table')
    }

    console.log('🎉 Job queue migration completed!')
  }
}
