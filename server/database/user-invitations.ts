import { getDatabase } from './db'
import { v4 as uuidv4 } from 'uuid'
import type { RoleName } from './roles'

export interface UserInvitation {
  id: number
  email: string
  token: string
  invited_by: number
  role: RoleName | null
  status: 'pending' | 'accepted' | 'expired' | 'revoked'
  expires_at: string
  accepted_at: string | null
  created_at: string
  updated_at: string
}

export interface UserInvitationWithInviter extends UserInvitation {
  inviter_name: string
  inviter_email: string
}

export interface CreateInvitationData {
  email: string
  invited_by: number
  role?: RoleName | null
  expires_in_days?: number // Default: 7 days
}

export class UserInvitationService {
  private db = getDatabase()

  // Create a new invitation
  async createInvitation(data: CreateInvitationData): Promise<UserInvitation> {
    const { email, invited_by, role = null, expires_in_days = 7 } = data

    // Generate unique token
    const token = uuidv4()

    // Calculate expiration date
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expires_in_days)

    const stmt = this.db.prepare(`
      INSERT INTO user_invitations (email, token, invited_by, role, expires_at)
      VALUES (?, ?, ?, ?, ?)
    `)

    try {
      const result = await stmt.run(
        email,
        token,
        invited_by,
        role,
        expiresAt.toISOString()
      )
      return (await this.getInvitationById(result.lastInsertRowid as number))!
    } catch (error: any) {
      if (error.code === '23505') { // Unique violation
        throw new Error('An invitation for this email already exists')
      }
      throw error
    }
  }

  // Get invitation by ID
  async getInvitationById(id: number): Promise<UserInvitation | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM user_invitations WHERE id = ?
    `)
    return await stmt.get(id) as UserInvitation | null
  }

  // Get invitation by token
  async getInvitationByToken(token: string): Promise<UserInvitation | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM user_invitations WHERE token = ?
    `)
    return await stmt.get(token) as UserInvitation | null
  }

  // Get all invitations with inviter info
  async getAllInvitationsWithInviter(): Promise<UserInvitationWithInviter[]> {
    const stmt = this.db.prepare(`
      SELECT
        ui.*,
        u.display_name as inviter_name,
        u.email as inviter_email
      FROM user_invitations ui
      LEFT JOIN users u ON ui.invited_by = u.id
      ORDER BY ui.created_at DESC
    `)
    return await stmt.all() as UserInvitationWithInviter[]
  }

  // Get pending invitations
  async getPendingInvitations(): Promise<UserInvitationWithInviter[]> {
    const stmt = this.db.prepare(`
      SELECT
        ui.*,
        u.display_name as inviter_name,
        u.email as inviter_email
      FROM user_invitations ui
      LEFT JOIN users u ON ui.invited_by = u.id
      WHERE ui.status = 'pending'
        AND ui.expires_at > CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
      ORDER BY ui.created_at DESC
    `)
    return await stmt.all() as UserInvitationWithInviter[]
  }

  // Validate invitation token
  async validateInvitation(token: string): Promise<{ valid: boolean; invitation?: UserInvitation; reason?: string }> {
    const invitation = await this.getInvitationByToken(token)

    if (!invitation) {
      return { valid: false, reason: 'Invalid invitation token' }
    }

    if (invitation.status !== 'pending') {
      return { valid: false, reason: `Invitation has been ${invitation.status}`, invitation }
    }

    const now = new Date()
    const expiresAt = new Date(invitation.expires_at)

    if (now > expiresAt) {
      // Auto-expire the invitation
      await this.updateInvitationStatus(invitation.id, 'expired')
      return { valid: false, reason: 'Invitation has expired', invitation }
    }

    return { valid: true, invitation }
  }

  // Update invitation status
  async updateInvitationStatus(
    id: number,
    status: 'pending' | 'accepted' | 'expired' | 'revoked',
    accepted_at?: string
  ): Promise<boolean> {
    let query = `
      UPDATE user_invitations
      SET status = ?, updated_at = CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
    `
    const params: any[] = [status]

    if (status === 'accepted' && accepted_at) {
      query += `, accepted_at = ?`
      params.push(accepted_at)
    }

    query += ` WHERE id = ?`
    params.push(id)

    const stmt = this.db.prepare(query)
    const result = await stmt.run(...params)
    return result.changes > 0
  }

  // Mark invitation as accepted
  async acceptInvitation(id: number): Promise<boolean> {
    return this.updateInvitationStatus(id, 'accepted', new Date().toISOString())
  }

  // Revoke invitation
  async revokeInvitation(id: number): Promise<boolean> {
    return this.updateInvitationStatus(id, 'revoked')
  }

  // Delete invitation (hard delete)
  async deleteInvitation(id: number): Promise<boolean> {
    const stmt = this.db.prepare('DELETE FROM user_invitations WHERE id = ?')
    const result = await stmt.run(id)
    return result.changes > 0
  }

  // Check if email has pending invitation
  async hasPendingInvitation(email: string): Promise<boolean> {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM user_invitations
      WHERE email = ?
        AND status = 'pending'
        AND expires_at > CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
    `)
    const result = await stmt.get(email) as { count: number }
    return result.count > 0
  }

  // Cleanup expired invitations (can be run periodically)
  async cleanupExpiredInvitations(): Promise<number> {
    const stmt = this.db.prepare(`
      UPDATE user_invitations
      SET status = 'expired', updated_at = CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
      WHERE status = 'pending'
        AND expires_at < CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
    `)
    const result = await stmt.run()
    return result.changes
  }
}

// Export singleton instance
export const userInvitationService = new UserInvitationService()
