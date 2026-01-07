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
}

export default class MarketingEmailSentByMigration extends BaseMigration {
  id = 24
  name = 'Add sent_by column to marketing_emails'

  async up(sql) {
    console.log('📥 Adding sent_by column to marketing_emails...')

    const sentByExists = await this.columnExists(sql, 'marketing_emails', 'sent_by')
    if (!sentByExists) {
      await this.exec(sql, `
        ALTER TABLE marketing_emails
        ADD COLUMN sent_by UUID REFERENCES users(id)
      `)
      console.log('  ✅ Added sent_by column')
    } else {
      console.log('  ℹ️  sent_by column already exists')
    }

    console.log('🎉 Marketing email sent_by migration completed!')
  }
}
