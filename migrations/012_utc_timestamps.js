class BaseMigration {
  async exec(sql, query) {
    await sql.unsafe(query)
  }
}

export default class UtcTimestampsMigration extends BaseMigration {
  id = 12
  name = 'Standardize timestamps to UTC'

  async up(sql) {
    console.log('🕐 Standardizing all timestamps to UTC...')

    // Update default values for all timestamp columns to use explicit UTC
    // This ensures consistent UTC storage regardless of database server timezone

    // campaigns
    await this.exec(sql, `
      ALTER TABLE campaigns
      ALTER COLUMN created_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
      ALTER COLUMN updated_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
    `)
    console.log('  ✅ campaigns timestamps updated')

    // prayer_content
    await this.exec(sql, `
      ALTER TABLE prayer_content
      ALTER COLUMN created_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
      ALTER COLUMN updated_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
    `)
    console.log('  ✅ prayer_content timestamps updated')

    // prayer_activity
    await this.exec(sql, `
      ALTER TABLE prayer_activity
      ALTER COLUMN timestamp SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
    `)
    console.log('  ✅ prayer_activity timestamps updated')

    // user_invitations
    await this.exec(sql, `
      ALTER TABLE user_invitations
      ALTER COLUMN created_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
      ALTER COLUMN updated_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
    `)
    console.log('  ✅ user_invitations timestamps updated')

    // campaign_users
    await this.exec(sql, `
      ALTER TABLE campaign_users
      ALTER COLUMN created_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
    `)
    console.log('  ✅ campaign_users timestamps updated')

    // libraries
    await this.exec(sql, `
      ALTER TABLE libraries
      ALTER COLUMN created_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
      ALTER COLUMN updated_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
    `)
    console.log('  ✅ libraries timestamps updated')

    // library_content
    await this.exec(sql, `
      ALTER TABLE library_content
      ALTER COLUMN created_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
      ALTER COLUMN updated_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
    `)
    console.log('  ✅ library_content timestamps updated')

    // campaign_library_config
    await this.exec(sql, `
      ALTER TABLE campaign_library_config
      ALTER COLUMN created_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
      ALTER COLUMN updated_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
    `)
    console.log('  ✅ campaign_library_config timestamps updated')

    // app_config
    await this.exec(sql, `
      ALTER TABLE app_config
      ALTER COLUMN updated_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
    `)
    console.log('  ✅ app_config timestamps updated')

    // reminder_emails_sent
    await this.exec(sql, `
      ALTER TABLE reminder_emails_sent
      ALTER COLUMN sent_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
    `)
    console.log('  ✅ reminder_emails_sent timestamps updated')

    // subscribers
    await this.exec(sql, `
      ALTER TABLE subscribers
      ALTER COLUMN created_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
      ALTER COLUMN updated_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
    `)
    console.log('  ✅ subscribers timestamps updated')

    // contact_methods
    await this.exec(sql, `
      ALTER TABLE contact_methods
      ALTER COLUMN created_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
      ALTER COLUMN updated_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
    `)
    console.log('  ✅ contact_methods timestamps updated')

    // campaign_subscriptions
    await this.exec(sql, `
      ALTER TABLE campaign_subscriptions
      ALTER COLUMN created_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
      ALTER COLUMN updated_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
    `)
    console.log('  ✅ campaign_subscriptions timestamps updated')

    console.log('🎉 UTC timestamps migration completed successfully!')
  }
}
