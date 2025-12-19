/**
 * Migration: Campaign Users
 *
 * Adds campaign_users table to track which campaigns a user can access
 * This supports the campaign_editor role which can only manage assigned campaigns
 */

class BaseMigration {
  async exec(sql, query) {
    await sql.unsafe(query)
  }
}

export default class CampaignUsersMigration extends BaseMigration {
  id = 3
  name = 'Campaign Users'

  async up(sql) {
    console.log('📥 Creating campaign_users table...')

    // Campaign users junction table
    await this.exec(sql, `
      CREATE TABLE IF NOT EXISTS campaign_users (
        campaign_id INTEGER NOT NULL,
        user_id UUID NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (campaign_id, user_id),
        FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `)

    // Create indexes for faster lookups
    await this.exec(sql, 'CREATE INDEX IF NOT EXISTS idx_campaign_users_user ON campaign_users(user_id)')
    await this.exec(sql, 'CREATE INDEX IF NOT EXISTS idx_campaign_users_campaign ON campaign_users(campaign_id)')

    console.log('  ✅ Campaign users table created')
    console.log('🎉 Campaign users migration completed successfully!')
  }

  async down(sql) {
    console.log('📥 Rolling back campaign_users table...')
    await this.exec(sql, 'DROP TABLE IF EXISTS campaign_users')
    console.log('  ✅ Campaign users table dropped')
  }
}
