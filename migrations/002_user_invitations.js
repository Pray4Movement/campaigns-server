/**
 * Migration: User Invitations
 *
 * Adds user_invitations table to support invitation workflow
 */

class BaseMigration {
  async exec(pool, sql) {
    await pool.query(sql)
  }

  async query(pool, sql, params = []) {
    const result = await pool.query(sql, params)
    return result.rows
  }

  down(pool) {
    throw new Error(`Down migration not implemented for migration ${this.id}`)
  }
}

export default class UserInvitationsMigration extends BaseMigration {
  id = 2
  name = 'User Invitations'

  async up(pool) {
    console.log('📥 Creating user invitations table...')

    // User invitations table
    await this.exec(pool, `
      CREATE TABLE IF NOT EXISTS user_invitations (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL,
        token TEXT UNIQUE NOT NULL,
        invited_by INTEGER NOT NULL,
        role_id INTEGER DEFAULT NULL,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'expired', 'revoked')),
        expires_at TIMESTAMP NOT NULL,
        accepted_at TIMESTAMP DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL
      )
    `)

    // Create indexes for faster lookups
    await this.exec(pool, 'CREATE INDEX IF NOT EXISTS idx_user_invitations_email ON user_invitations(email)')
    await this.exec(pool, 'CREATE INDEX IF NOT EXISTS idx_user_invitations_token ON user_invitations(token)')
    await this.exec(pool, 'CREATE INDEX IF NOT EXISTS idx_user_invitations_status ON user_invitations(status)')
    await this.exec(pool, 'CREATE INDEX IF NOT EXISTS idx_user_invitations_invited_by ON user_invitations(invited_by)')

    console.log('  ✅ User invitations table created')
    console.log('🎉 User invitations migration completed successfully!')
  }

  async down(pool) {
    console.log('📥 Rolling back user invitations table...')
    await this.exec(pool, 'DROP TABLE IF EXISTS user_invitations')
    console.log('  ✅ User invitations table dropped')
  }
}
