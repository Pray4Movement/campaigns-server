import { getDatabase } from './db'

export interface Role {
  id: number
  name: string
  description: string
  created_at: string
  updated_at: string
}

export interface Permission {
  id: number
  name: string
  description: string
  created_at: string
}

export class RoleService {
  private db = getDatabase()

  // Create default roles if they don't exist
  async initializeDefaultRoles() {
    const roles = [
      { name: 'admin', description: 'Full system administrator - can see and do everything' },
      { name: 'campaign_editor', description: 'Can manage campaigns they have been given access to' }
    ]

    const permissions = [
      { name: 'campaigns.view', description: 'View campaigns' },
      { name: 'campaigns.create', description: 'Create campaigns' },
      { name: 'campaigns.edit', description: 'Edit campaigns' },
      { name: 'campaigns.delete', description: 'Delete campaigns' },
      { name: 'content.view', description: 'View prayer content' },
      { name: 'content.create', description: 'Create prayer content' },
      { name: 'content.edit', description: 'Edit prayer content' },
      { name: 'content.delete', description: 'Delete prayer content' },
      { name: 'users.manage', description: 'Manage users' },
      { name: 'roles.manage', description: 'Manage roles and permissions' }
    ]

    // Insert roles if they don't exist
    for (const role of roles) {
      const existing = await this.db.prepare('SELECT id FROM roles WHERE name = ?').get(role.name)
      if (!existing) {
        await this.db.prepare('INSERT INTO roles (name, description) VALUES (?, ?)').run(role.name, role.description)
      }
    }

    // Insert permissions if they don't exist
    for (const permission of permissions) {
      const existing = await this.db.prepare('SELECT id FROM permissions WHERE name = ?').get(permission.name)
      if (!existing) {
        await this.db.prepare('INSERT INTO permissions (name, description) VALUES (?, ?)').run(permission.name, permission.description)
      }
    }

    // Assign all permissions to admin role
    const adminRole = await this.db.prepare('SELECT id FROM roles WHERE name = ?').get('admin') as { id: number } | undefined
    if (adminRole) {
      const allPermissions = await this.db.prepare('SELECT id FROM permissions').all() as { id: number }[]
      for (const perm of allPermissions) {
        const existing = await this.db.prepare('SELECT 1 FROM role_permissions WHERE role_id = ? AND permission_id = ?')
          .get(adminRole.id, perm.id)
        if (!existing) {
          await this.db.prepare('INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)')
            .run(adminRole.id, perm.id)
        }
      }
    }

    // Assign campaign and content permissions to campaign_editor role (but not user/role management)
    const editorRole = await this.db.prepare('SELECT id FROM roles WHERE name = ?').get('campaign_editor') as { id: number } | undefined
    if (editorRole) {
      const editorPermissions = await this.db.prepare(
        "SELECT id FROM permissions WHERE name LIKE 'campaigns.%' OR name LIKE 'content.%'"
      ).all() as { id: number }[]
      for (const perm of editorPermissions) {
        const existing = await this.db.prepare('SELECT 1 FROM role_permissions WHERE role_id = ? AND permission_id = ?')
          .get(editorRole.id, perm.id)
        if (!existing) {
          await this.db.prepare('INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)')
            .run(editorRole.id, perm.id)
        }
      }
    }
  }

  // Get all roles
  async getAllRoles(): Promise<Role[]> {
    const stmt = this.db.prepare('SELECT * FROM roles ORDER BY name')
    return await stmt.all() as Role[]
  }

  // Get role by ID
  async getRoleById(id: number): Promise<Role | null> {
    const stmt = this.db.prepare('SELECT * FROM roles WHERE id = ?')
    return await stmt.get(id) as Role | null
  }

  // Get permissions for a role
  async getRolePermissions(roleId: number): Promise<Permission[]> {
    const stmt = this.db.prepare(`
      SELECT p.* FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = ?
    `)
    return await stmt.all(roleId) as Permission[]
  }

  // Get user roles
  async getUserRoles(userId: number): Promise<Role[]> {
    const stmt = this.db.prepare(`
      SELECT r.* FROM roles r
      JOIN user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = ?
    `)
    return await stmt.all(userId) as Role[]
  }

  // Check if user has permission
  async userHasPermission(userId: number, permissionName: string): Promise<boolean> {
    const stmt = this.db.prepare(`
      SELECT 1 FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      JOIN user_roles ur ON rp.role_id = ur.role_id
      WHERE ur.user_id = ? AND p.name = ?
      LIMIT 1
    `)
    return !!(await stmt.get(userId, permissionName))
  }

  // Assign role to user
  async assignRoleToUser(userId: number, roleId: number): Promise<void> {
    const stmt = this.db.prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?) ON CONFLICT DO NOTHING')
    await stmt.run(userId, roleId)
  }

  // Remove role from user
  async removeRoleFromUser(userId: number, roleId: number): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM user_roles WHERE user_id = ? AND role_id = ?')
    await stmt.run(userId, roleId)
  }

  // Check if user has admin role
  async isAdmin(userId: number): Promise<boolean> {
    const stmt = this.db.prepare(`
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = ? AND r.name = 'admin'
      LIMIT 1
    `)
    return !!(await stmt.get(userId))
  }

  // Check if user has campaign_editor role
  async isCampaignEditor(userId: number): Promise<boolean> {
    const stmt = this.db.prepare(`
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = ? AND r.name = 'campaign_editor'
      LIMIT 1
    `)
    return !!(await stmt.get(userId))
  }

  // Get role by name
  async getRoleByName(name: string): Promise<Role | null> {
    const stmt = this.db.prepare('SELECT * FROM roles WHERE name = ?')
    return await stmt.get(name) as Role | null
  }
}

// Export singleton instance
export const roleService = new RoleService()
