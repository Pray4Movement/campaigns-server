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
  initializeDefaultRoles() {
    const roles = [
      { name: 'admin', description: 'Full system administrator' },
      { name: 'campaign_editor', description: 'Can create and edit campaigns' },
      { name: 'content_creator', description: 'Can create prayer content' }
    ]

    const permissions = [
      { name: 'campaigns.create', description: 'Create campaigns' },
      { name: 'campaigns.edit', description: 'Edit campaigns' },
      { name: 'campaigns.delete', description: 'Delete campaigns' },
      { name: 'campaigns.view', description: 'View campaigns' },
      { name: 'content.create', description: 'Create prayer content' },
      { name: 'content.edit', description: 'Edit prayer content' },
      { name: 'content.delete', description: 'Delete prayer content' },
      { name: 'users.manage', description: 'Manage users' },
      { name: 'roles.manage', description: 'Manage roles and permissions' }
    ]

    // Insert roles if they don't exist
    for (const role of roles) {
      const existing = this.db.prepare('SELECT id FROM roles WHERE name = ?').get(role.name)
      if (!existing) {
        this.db.prepare('INSERT INTO roles (name, description) VALUES (?, ?)').run(role.name, role.description)
      }
    }

    // Insert permissions if they don't exist
    for (const permission of permissions) {
      const existing = this.db.prepare('SELECT id FROM permissions WHERE name = ?').get(permission.name)
      if (!existing) {
        this.db.prepare('INSERT INTO permissions (name, description) VALUES (?, ?)').run(permission.name, permission.description)
      }
    }

    // Assign all permissions to admin role
    const adminRole = this.db.prepare('SELECT id FROM roles WHERE name = ?').get('admin') as { id: number } | undefined
    if (adminRole) {
      const allPermissions = this.db.prepare('SELECT id FROM permissions').all() as { id: number }[]
      for (const perm of allPermissions) {
        const existing = this.db.prepare('SELECT 1 FROM role_permissions WHERE role_id = ? AND permission_id = ?')
          .get(adminRole.id, perm.id)
        if (!existing) {
          this.db.prepare('INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)')
            .run(adminRole.id, perm.id)
        }
      }
    }

    // Assign campaign permissions to campaign_editor role
    const editorRole = this.db.prepare('SELECT id FROM roles WHERE name = ?').get('campaign_editor') as { id: number } | undefined
    if (editorRole) {
      const campaignPerms = this.db.prepare(
        "SELECT id FROM permissions WHERE name LIKE 'campaigns.%'"
      ).all() as { id: number }[]
      for (const perm of campaignPerms) {
        const existing = this.db.prepare('SELECT 1 FROM role_permissions WHERE role_id = ? AND permission_id = ?')
          .get(editorRole.id, perm.id)
        if (!existing) {
          this.db.prepare('INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)')
            .run(editorRole.id, perm.id)
        }
      }
    }
  }

  // Get all roles
  getAllRoles(): Role[] {
    const stmt = this.db.prepare('SELECT * FROM roles ORDER BY name')
    return stmt.all() as Role[]
  }

  // Get role by ID
  getRoleById(id: number): Role | null {
    const stmt = this.db.prepare('SELECT * FROM roles WHERE id = ?')
    return stmt.get(id) as Role | null
  }

  // Get permissions for a role
  getRolePermissions(roleId: number): Permission[] {
    const stmt = this.db.prepare(`
      SELECT p.* FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = ?
    `)
    return stmt.all(roleId) as Permission[]
  }

  // Get user roles
  getUserRoles(userId: number): Role[] {
    const stmt = this.db.prepare(`
      SELECT r.* FROM roles r
      JOIN user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = ?
    `)
    return stmt.all(userId) as Role[]
  }

  // Check if user has permission
  userHasPermission(userId: number, permissionName: string): boolean {
    const stmt = this.db.prepare(`
      SELECT 1 FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      JOIN user_roles ur ON rp.role_id = ur.role_id
      WHERE ur.user_id = ? AND p.name = ?
      LIMIT 1
    `)
    return !!stmt.get(userId, permissionName)
  }

  // Assign role to user
  assignRoleToUser(userId: number, roleId: number): void {
    const stmt = this.db.prepare('INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)')
    stmt.run(userId, roleId)
  }

  // Remove role from user
  removeRoleFromUser(userId: number, roleId: number): void {
    const stmt = this.db.prepare('DELETE FROM user_roles WHERE user_id = ? AND role_id = ?')
    stmt.run(userId, roleId)
  }
}

// Export singleton instance
export const roleService = new RoleService()

// Initialize default roles on import
roleService.initializeDefaultRoles()
