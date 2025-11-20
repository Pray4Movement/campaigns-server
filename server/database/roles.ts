import { getDatabase } from './db'

// Valid role names
export type RoleName = 'admin' | 'campaign_editor'

// Role definitions with permissions
export const ROLES = {
  admin: {
    name: 'admin' as RoleName,
    description: 'Full system administrator - can see and do everything',
    permissions: [
      'campaigns.view',
      'campaigns.create',
      'campaigns.edit',
      'campaigns.delete',
      'content.view',
      'content.create',
      'content.edit',
      'content.delete',
      'users.manage',
      'roles.manage'
    ]
  },
  campaign_editor: {
    name: 'campaign_editor' as RoleName,
    description: 'Can manage campaigns they have been given access to',
    permissions: [
      'campaigns.view',
      'campaigns.create',
      'campaigns.edit',
      'campaigns.delete',
      'content.view',
      'content.create',
      'content.edit',
      'content.delete'
    ]
  }
}

export class RoleService {
  private db = getDatabase()

  // Get user's role
  async getUserRole(userId: string): Promise<RoleName | null> {
    const stmt = this.db.prepare('SELECT role FROM users WHERE id = ?')
    const result = await stmt.get(userId) as { role: RoleName | null } | null
    return result?.role || null
  }

  // Set user's role
  async setUserRole(userId: string, role: RoleName | null): Promise<void> {
    const stmt = this.db.prepare('UPDATE users SET role = ? WHERE id = ?')
    await stmt.run(role, userId)
  }

  // Check if user has permission
  async userHasPermission(userId: string, permissionName: string): Promise<boolean> {
    const role = await this.getUserRole(userId)
    if (!role) return false

    const roleConfig = ROLES[role]
    return roleConfig.permissions.includes(permissionName)
  }

  // Check if user has admin role
  async isAdmin(userId: string): Promise<boolean> {
    const role = await this.getUserRole(userId)
    return role === 'admin'
  }

  // Check if user has campaign_editor role
  async isCampaignEditor(userId: string): Promise<boolean> {
    const role = await this.getUserRole(userId)
    return role === 'campaign_editor'
  }

  // Get all available roles
  getAllRoles() {
    return Object.values(ROLES)
  }

  // Get role by name
  getRoleByName(name: string) {
    return ROLES[name as RoleName] || null
  }
}

// Export singleton instance
export const roleService = new RoleService()
