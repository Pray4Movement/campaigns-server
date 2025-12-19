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

export default class ConsentColumnsMigration extends BaseMigration {
  id = 15
  name = 'Add consent columns for marketing permissions'

  async up(sql) {
    console.log('📥 Adding consent columns...')

    // Add consent_doxa_general to contact_methods
    const doxaConsentExists = await this.columnExists(sql, 'contact_methods', 'consent_doxa_general')
    if (!doxaConsentExists) {
      await this.exec(sql, `
        ALTER TABLE contact_methods
        ADD COLUMN consent_doxa_general BOOLEAN DEFAULT false
      `)
      console.log('  ✅ Added consent_doxa_general column to contact_methods')
    } else {
      console.log('  ℹ️  consent_doxa_general column already exists')
    }

    // Add consent_doxa_general_at to contact_methods
    const doxaConsentAtExists = await this.columnExists(sql, 'contact_methods', 'consent_doxa_general_at')
    if (!doxaConsentAtExists) {
      await this.exec(sql, `
        ALTER TABLE contact_methods
        ADD COLUMN consent_doxa_general_at TIMESTAMP
      `)
      console.log('  ✅ Added consent_doxa_general_at column to contact_methods')
    } else {
      console.log('  ℹ️  consent_doxa_general_at column already exists')
    }

    // Add consented_campaign_ids to contact_methods (PostgreSQL array)
    const campaignIdsExists = await this.columnExists(sql, 'contact_methods', 'consented_campaign_ids')
    if (!campaignIdsExists) {
      await this.exec(sql, `
        ALTER TABLE contact_methods
        ADD COLUMN consented_campaign_ids INTEGER[] DEFAULT '{}'
      `)
      console.log('  ✅ Added consented_campaign_ids column to contact_methods')
    } else {
      console.log('  ℹ️  consented_campaign_ids column already exists')
    }

    // Add consented_campaign_ids_at to contact_methods (JSONB for timestamp mapping)
    const campaignIdsAtExists = await this.columnExists(sql, 'contact_methods', 'consented_campaign_ids_at')
    if (!campaignIdsAtExists) {
      await this.exec(sql, `
        ALTER TABLE contact_methods
        ADD COLUMN consented_campaign_ids_at JSONB DEFAULT '{}'
      `)
      console.log('  ✅ Added consented_campaign_ids_at column to contact_methods')
    } else {
      console.log('  ℹ️  consented_campaign_ids_at column already exists')
    }

    // Create index for finding subscribers who consented to Doxa updates
    const doxaIndexExists = await this.indexExists(sql, 'idx_contact_methods_doxa_consent')
    if (!doxaIndexExists) {
      await this.exec(sql, `
        CREATE INDEX idx_contact_methods_doxa_consent
        ON contact_methods(consent_doxa_general)
        WHERE consent_doxa_general = true
      `)
      console.log('  ✅ Created index on consent_doxa_general')
    }

    // Create GIN index for efficient campaign consent array queries
    const campaignIndexExists = await this.indexExists(sql, 'idx_contact_methods_campaign_consent')
    if (!campaignIndexExists) {
      await this.exec(sql, `
        CREATE INDEX idx_contact_methods_campaign_consent
        ON contact_methods USING GIN(consented_campaign_ids)
      `)
      console.log('  ✅ Created GIN index on consented_campaign_ids')
    }

    console.log('🎉 Consent columns migration completed!')
  }
}
