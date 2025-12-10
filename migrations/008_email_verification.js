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

export default class EmailVerificationMigration extends BaseMigration {
  id = 8
  name = 'Email Verification'

  async up(sql) {
    console.log('📥 Adding email verification columns to reminder_signups...')

    // Add email_verified column
    const emailVerifiedExists = await this.columnExists(sql, 'reminder_signups', 'email_verified')
    if (!emailVerifiedExists) {
      await this.exec(sql, `
        ALTER TABLE reminder_signups
        ADD COLUMN email_verified BOOLEAN DEFAULT false
      `)
    }

    // Add verification_token column
    const tokenExists = await this.columnExists(sql, 'reminder_signups', 'verification_token')
    if (!tokenExists) {
      await this.exec(sql, `
        ALTER TABLE reminder_signups
        ADD COLUMN verification_token TEXT DEFAULT NULL
      `)
    }

    // Add verification_token_expires_at column
    const expiresExists = await this.columnExists(sql, 'reminder_signups', 'verification_token_expires_at')
    if (!expiresExists) {
      await this.exec(sql, `
        ALTER TABLE reminder_signups
        ADD COLUMN verification_token_expires_at TIMESTAMP DEFAULT NULL
      `)
    }

    // Add verified_at column
    const verifiedAtExists = await this.columnExists(sql, 'reminder_signups', 'verified_at')
    if (!verifiedAtExists) {
      await this.exec(sql, `
        ALTER TABLE reminder_signups
        ADD COLUMN verified_at TIMESTAMP DEFAULT NULL
      `)
    }

    // Add unique index on verification_token for fast lookups
    await this.exec(sql, `
      CREATE UNIQUE INDEX IF NOT EXISTS idx_reminder_signups_verification_token
      ON reminder_signups(verification_token)
      WHERE verification_token IS NOT NULL
    `)

    console.log('  ✅ Email verification columns added')

    // Mark existing email signups as verified (grandfathered in)
    const result = await sql`
      UPDATE reminder_signups
      SET email_verified = true, verified_at = created_at
      WHERE delivery_method = 'email' AND email_verified = false
      RETURNING id
    `

    console.log(`  ✅ Grandfathered ${result.length} existing email signups as verified`)

    console.log('🎉 Email verification migration completed successfully!')
  }
}
