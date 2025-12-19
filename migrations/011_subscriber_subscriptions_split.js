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
}

export default class SubscriberSubscriptionsSplitMigration extends BaseMigration {
  id = 11
  name = 'Split subscribers from campaign subscriptions'

  async up(sql) {
    console.log('📥 Splitting subscriber data model...')

    // 1. Create subscribers table
    const subscribersExists = await this.tableExists(sql, 'subscribers')
    if (!subscribersExists) {
      await this.exec(sql, `
        CREATE TABLE subscribers (
          id SERIAL PRIMARY KEY,
          tracking_id TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)
      console.log('  ✅ subscribers table created')
    } else {
      console.log('  ℹ️  subscribers table already exists')
    }

    // 2. Create contact_methods table
    const contactMethodsExists = await this.tableExists(sql, 'contact_methods')
    if (!contactMethodsExists) {
      await this.exec(sql, `
        CREATE TABLE contact_methods (
          id SERIAL PRIMARY KEY,
          subscriber_id INTEGER NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
          type TEXT NOT NULL CHECK(type IN ('email', 'phone')),
          value TEXT NOT NULL,
          verified BOOLEAN DEFAULT false,
          verification_token TEXT DEFAULT NULL,
          verification_token_expires_at TIMESTAMP DEFAULT NULL,
          verified_at TIMESTAMP DEFAULT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(type, value)
        )
      `)
      console.log('  ✅ contact_methods table created')

      await this.exec(sql, 'CREATE INDEX idx_contact_methods_subscriber ON contact_methods(subscriber_id)')
      await this.exec(sql, 'CREATE INDEX idx_contact_methods_type_value ON contact_methods(type, LOWER(value))')
      await this.exec(sql, 'CREATE INDEX idx_contact_methods_verification_token ON contact_methods(verification_token) WHERE verification_token IS NOT NULL')
      console.log('  ✅ contact_methods indexes created')
    } else {
      console.log('  ℹ️  contact_methods table already exists')
    }

    // 3. Create campaign_subscriptions table
    const subscriptionsExists = await this.tableExists(sql, 'campaign_subscriptions')
    if (!subscriptionsExists) {
      await this.exec(sql, `
        CREATE TABLE campaign_subscriptions (
          id SERIAL PRIMARY KEY,
          campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
          subscriber_id INTEGER NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
          delivery_method TEXT NOT NULL CHECK(delivery_method IN ('email', 'whatsapp', 'app')),
          frequency TEXT NOT NULL,
          days_of_week TEXT DEFAULT NULL,
          time_preference TEXT NOT NULL,
          timezone TEXT DEFAULT 'UTC',
          prayer_duration INTEGER DEFAULT 10,
          next_reminder_utc TIMESTAMP,
          status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'unsubscribed')),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(campaign_id, subscriber_id)
        )
      `)
      console.log('  ✅ campaign_subscriptions table created')

      await this.exec(sql, 'CREATE INDEX idx_campaign_subscriptions_campaign ON campaign_subscriptions(campaign_id)')
      await this.exec(sql, 'CREATE INDEX idx_campaign_subscriptions_subscriber ON campaign_subscriptions(subscriber_id)')
      await this.exec(sql, `
        CREATE INDEX idx_campaign_subscriptions_next_reminder
        ON campaign_subscriptions(next_reminder_utc)
        WHERE status = 'active'
      `)
      console.log('  ✅ campaign_subscriptions indexes created')
    } else {
      console.log('  ℹ️  campaign_subscriptions table already exists')
    }

    // 4. Migrate data from reminder_signups
    const reminderSignupsExists = await this.tableExists(sql, 'reminder_signups')
    const backupExists = await this.tableExists(sql, 'reminder_signups_backup')

    if (reminderSignupsExists && !backupExists) {
      console.log('  📊 Migrating data from reminder_signups...')

      // Step 4a: Insert unique subscribers (dedupe by email first, then phone)
      // We use DISTINCT ON with LOWER(email) to dedupe by email (case-insensitive)
      await this.exec(sql, `
        INSERT INTO subscribers (tracking_id, name, created_at, updated_at)
        SELECT DISTINCT ON (LOWER(email))
          tracking_id, name, created_at, updated_at
        FROM reminder_signups
        WHERE email != '' AND email IS NOT NULL
        ORDER BY LOWER(email), created_at ASC
      `)
      console.log('    ✅ Subscribers created from email addresses')

      // For signups without email but with phone, create additional subscribers
      await this.exec(sql, `
        INSERT INTO subscribers (tracking_id, name, created_at, updated_at)
        SELECT DISTINCT ON (phone)
          tracking_id, name, created_at, updated_at
        FROM reminder_signups rs
        WHERE (rs.email = '' OR rs.email IS NULL)
          AND rs.phone != '' AND rs.phone IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM subscribers s WHERE s.tracking_id = rs.tracking_id
          )
        ORDER BY phone, created_at ASC
      `)
      console.log('    ✅ Subscribers created from phone numbers')

      // Step 4b: Create contact_methods for emails
      await this.exec(sql, `
        INSERT INTO contact_methods (subscriber_id, type, value, verified, verification_token, verification_token_expires_at, verified_at, created_at, updated_at)
        SELECT DISTINCT ON (LOWER(rs.email))
          s.id,
          'email',
          rs.email,
          rs.email_verified,
          rs.verification_token,
          rs.verification_token_expires_at,
          rs.verified_at,
          rs.created_at,
          rs.updated_at
        FROM reminder_signups rs
        JOIN subscribers s ON s.tracking_id = rs.tracking_id
        WHERE rs.email != '' AND rs.email IS NOT NULL
        ORDER BY LOWER(rs.email), rs.created_at ASC
      `)
      console.log('    ✅ Email contact methods created')

      // Create contact_methods for phones
      await this.exec(sql, `
        INSERT INTO contact_methods (subscriber_id, type, value, verified, created_at, updated_at)
        SELECT DISTINCT ON (rs.phone)
          s.id,
          'phone',
          rs.phone,
          false,
          rs.created_at,
          rs.updated_at
        FROM reminder_signups rs
        JOIN subscribers s ON s.tracking_id = rs.tracking_id
        WHERE rs.phone != '' AND rs.phone IS NOT NULL
        ORDER BY rs.phone, rs.created_at ASC
        ON CONFLICT (type, value) DO NOTHING
      `)
      console.log('    ✅ Phone contact methods created')

      // Step 4c: Create campaign_subscriptions for all signups
      // Link each signup to the subscriber that was created for their email/phone
      await this.exec(sql, `
        INSERT INTO campaign_subscriptions (
          campaign_id, subscriber_id, delivery_method, frequency, days_of_week,
          time_preference, timezone, prayer_duration, next_reminder_utc, status,
          created_at, updated_at
        )
        SELECT
          rs.campaign_id,
          COALESCE(
            (SELECT s.id FROM subscribers s
             JOIN contact_methods cm ON cm.subscriber_id = s.id
             WHERE cm.type = 'email' AND LOWER(cm.value) = LOWER(rs.email)
             LIMIT 1),
            (SELECT s.id FROM subscribers s
             JOIN contact_methods cm ON cm.subscriber_id = s.id
             WHERE cm.type = 'phone' AND cm.value = rs.phone
             LIMIT 1)
          ),
          rs.delivery_method,
          rs.frequency,
          rs.days_of_week,
          rs.time_preference,
          COALESCE(rs.timezone, 'UTC'),
          COALESCE(rs.prayer_duration, 10),
          rs.next_reminder_utc,
          rs.status,
          rs.created_at,
          rs.updated_at
        FROM reminder_signups rs
        WHERE rs.email != '' OR rs.phone != ''
        ON CONFLICT (campaign_id, subscriber_id) DO NOTHING
      `)
      console.log('    ✅ Campaign subscriptions created')

      // Step 4d: Update reminder_emails_sent to reference campaign_subscriptions
      // First, add the new column
      const subscriptionIdExists = await this.columnExists(sql, 'reminder_emails_sent', 'subscription_id')
      if (!subscriptionIdExists) {
        await this.exec(sql, `
          ALTER TABLE reminder_emails_sent
          ADD COLUMN subscription_id INTEGER REFERENCES campaign_subscriptions(id) ON DELETE CASCADE
        `)
        console.log('    ✅ Added subscription_id column to reminder_emails_sent')

        // Migrate the data - map old signup_id to new subscription_id
        await this.exec(sql, `
          UPDATE reminder_emails_sent res
          SET subscription_id = cs.id
          FROM reminder_signups rs
          JOIN subscribers s ON s.tracking_id = rs.tracking_id
          JOIN campaign_subscriptions cs ON cs.subscriber_id = s.id AND cs.campaign_id = rs.campaign_id
          WHERE res.signup_id = rs.id
        `)
        console.log('    ✅ Migrated reminder_emails_sent to use subscription_id')
      }

      // Step 4e: Rename reminder_signups to backup
      await this.exec(sql, 'ALTER TABLE reminder_signups RENAME TO reminder_signups_backup')
      console.log('    ✅ reminder_signups renamed to reminder_signups_backup')
    } else if (backupExists) {
      console.log('  ℹ️  Data already migrated (backup table exists)')
    } else {
      console.log('  ℹ️  No reminder_signups table to migrate')
    }

    // 5. Drop old signup_id column from reminder_emails_sent if subscription_id exists
    const hasSubscriptionId = await this.columnExists(sql, 'reminder_emails_sent', 'subscription_id')
    const hasSignupId = await this.columnExists(sql, 'reminder_emails_sent', 'signup_id')
    if (hasSubscriptionId && hasSignupId) {
      // Drop the old constraint first
      const constraintExists = await this.constraintExists(sql, 'reminder_emails_sent', 'reminder_emails_sent_signup_id_sent_date_key')
      if (constraintExists) {
        await this.exec(sql, 'ALTER TABLE reminder_emails_sent DROP CONSTRAINT reminder_emails_sent_signup_id_sent_date_key')
      }

      // Add new unique constraint
      const newConstraintExists = await this.constraintExists(sql, 'reminder_emails_sent', 'reminder_emails_sent_subscription_id_sent_date_key')
      if (!newConstraintExists) {
        await this.exec(sql, `
          ALTER TABLE reminder_emails_sent
          ADD CONSTRAINT reminder_emails_sent_subscription_id_sent_date_key
          UNIQUE (subscription_id, sent_date)
        `)
      }

      // Drop old column
      await this.exec(sql, 'ALTER TABLE reminder_emails_sent DROP COLUMN signup_id')
      console.log('  ✅ Removed old signup_id column from reminder_emails_sent')
    }

    console.log('🎉 Subscriber/subscriptions split migration completed successfully!')
  }
}
