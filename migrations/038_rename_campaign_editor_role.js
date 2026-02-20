class BaseMigration {
  async exec(sql, query) {
    await sql.unsafe(query)
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

export default class RenameCampaignEditorRole extends BaseMigration {
  id = 38
  name = 'Rename campaign_editor role to people_group_editor'

  async up(sql) {
    console.log('📥 Renaming campaign_editor role to people_group_editor...')

    // Drop CHECK constraints first (before updating rows)
    if (await this.constraintExists(sql, 'users', 'users_role_check')) {
      await this.exec(sql, `ALTER TABLE users DROP CONSTRAINT users_role_check`)
      console.log('  ✅ Dropped constraint users_role_check on users')
    }

    if (await this.constraintExists(sql, 'user_invitations', 'user_invitations_role_check')) {
      await this.exec(sql, `ALTER TABLE user_invitations DROP CONSTRAINT user_invitations_role_check`)
      console.log('  ✅ Dropped constraint user_invitations_role_check on user_invitations')
    }

    // Update existing rows
    await this.exec(sql, `UPDATE users SET role = 'people_group_editor' WHERE role = 'campaign_editor'`)
    console.log('  ✅ Updated users.role values')

    await this.exec(sql, `UPDATE user_invitations SET role = 'people_group_editor' WHERE role = 'campaign_editor'`)
    console.log('  ✅ Updated user_invitations.role values')

    // Recreate CHECK constraints with new value
    await this.exec(sql, `ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'people_group_editor'))`)
    console.log('  ✅ Added new CHECK constraint on users.role')

    await this.exec(sql, `ALTER TABLE user_invitations ADD CONSTRAINT user_invitations_role_check CHECK (role IN ('admin', 'people_group_editor'))`)
    console.log('  ✅ Added new CHECK constraint on user_invitations.role')

    console.log('🎉 campaign_editor → people_group_editor migration completed!')
  }
}
