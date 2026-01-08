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

export default class TranslationJobsMigration extends BaseMigration {
  id = 29
  name = 'Create translation jobs table'

  async up(sql) {
    console.log('📥 Creating translation jobs table...')

    const tableExists = await this.tableExists(sql, 'translation_jobs')
    if (!tableExists) {
      await this.exec(sql, `
        CREATE TABLE translation_jobs (
          id SERIAL PRIMARY KEY,
          batch_id UUID NOT NULL,
          library_id INTEGER NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
          source_content_id INTEGER NOT NULL REFERENCES library_content(id) ON DELETE CASCADE,
          target_language TEXT NOT NULL,
          overwrite BOOLEAN DEFAULT FALSE,
          status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
          attempts INTEGER DEFAULT 0,
          error_message TEXT,
          created_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
          completed_at TIMESTAMP
        )
      `)
      console.log('  ✅ Created translation_jobs table')
    } else {
      console.log('  ℹ️  translation_jobs table already exists')
    }

    // Create indexes
    const batchIndexExists = await this.indexExists(sql, 'idx_translation_jobs_batch')
    if (!batchIndexExists) {
      await this.exec(sql, `
        CREATE INDEX idx_translation_jobs_batch ON translation_jobs(batch_id)
      `)
      console.log('  ✅ Created idx_translation_jobs_batch index')
    }

    const statusIndexExists = await this.indexExists(sql, 'idx_translation_jobs_status')
    if (!statusIndexExists) {
      await this.exec(sql, `
        CREATE INDEX idx_translation_jobs_status ON translation_jobs(status)
      `)
      console.log('  ✅ Created idx_translation_jobs_status index')
    }

    const pendingIndexExists = await this.indexExists(sql, 'idx_translation_jobs_pending')
    if (!pendingIndexExists) {
      await this.exec(sql, `
        CREATE INDEX idx_translation_jobs_pending ON translation_jobs(status) WHERE status = 'pending'
      `)
      console.log('  ✅ Created idx_translation_jobs_pending index')
    }

    console.log('🎉 Translation jobs migration completed!')
  }
}
