import { getDatabase } from './db'

export interface CampaignAccess {
  people_group_id: number
  user_id: string
  created_at: string
}

export class CampaignAccessService {
  private db = getDatabase()

  // Assign a user to a people group (via campaign_users table)
  async assignUserToCampaign(userId: string, peopleGroupId: number): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO campaign_users (user_id, people_group_id)
      VALUES (?, ?)
      ON CONFLICT DO NOTHING
    `)
    await stmt.run(userId, peopleGroupId)
  }

  // Remove a user from a people group
  async removeUserFromCampaign(userId: string, peopleGroupId: number): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM campaign_users WHERE user_id = ? AND people_group_id = ?')
    await stmt.run(userId, peopleGroupId)
  }

  // Check if a user has access to a people group
  async userHasAccess(userId: string, peopleGroupId: number): Promise<boolean> {
    const stmt = this.db.prepare(`
      SELECT 1 FROM campaign_users
      WHERE user_id = ? AND people_group_id = ?
      LIMIT 1
    `)
    return !!(await stmt.get(userId, peopleGroupId))
  }

  // Get all people group IDs a user has access to
  async getUserCampaigns(userId: string): Promise<number[]> {
    const stmt = this.db.prepare(`
      SELECT people_group_id FROM campaign_users
      WHERE user_id = ?
      ORDER BY created_at DESC
    `)
    const results = await stmt.all(userId) as Array<{ people_group_id: number }>
    return results.map(r => r.people_group_id)
  }

  // Get all users who have access to a people group
  async getCampaignUsers(peopleGroupId: number): Promise<string[]> {
    const stmt = this.db.prepare(`
      SELECT user_id FROM campaign_users
      WHERE people_group_id = ?
      ORDER BY created_at DESC
    `)
    const results = await stmt.all(peopleGroupId) as Array<{ user_id: string }>
    return results.map(r => r.user_id)
  }

  // Assign multiple users to a people group
  async assignUsersToCampaign(userIds: string[], peopleGroupId: number): Promise<void> {
    for (const userId of userIds) {
      await this.assignUserToCampaign(userId, peopleGroupId)
    }
  }

  // Assign a user to multiple people groups
  async assignUserToCampaigns(userId: string, peopleGroupIds: number[]): Promise<void> {
    for (const peopleGroupId of peopleGroupIds) {
      await this.assignUserToCampaign(userId, peopleGroupId)
    }
  }

  // Remove all users from a people group
  async removeAllUsersFromCampaign(peopleGroupId: number): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM campaign_users WHERE people_group_id = ?')
    await stmt.run(peopleGroupId)
  }

  // Remove user from all people groups
  async removeUserFromAllCampaigns(userId: string): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM campaign_users WHERE user_id = ?')
    await stmt.run(userId)
  }

  // Get people group access count for a user
  async getUserCampaignCount(userId: string): Promise<number> {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM campaign_users WHERE user_id = ?')
    const result = await stmt.get(userId) as { count: number }
    return result.count
  }

  // Get user count for a people group
  async getCampaignUserCount(peopleGroupId: number): Promise<number> {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM campaign_users WHERE people_group_id = ?')
    const result = await stmt.get(peopleGroupId) as { count: number }
    return result.count
  }
}

// Export singleton instance
export const campaignAccessService = new CampaignAccessService()
