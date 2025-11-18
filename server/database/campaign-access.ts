import { getDatabase } from './db'

export interface CampaignAccess {
  campaign_id: number
  user_id: string
  created_at: string
}

export class CampaignAccessService {
  private db = getDatabase()

  // Assign a user to a campaign
  async assignUserToCampaign(userId: string, campaignId: number): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO campaign_users (user_id, campaign_id)
      VALUES (?, ?)
      ON CONFLICT DO NOTHING
    `)
    await stmt.run(userId, campaignId)
  }

  // Remove a user from a campaign
  async removeUserFromCampaign(userId: string, campaignId: number): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM campaign_users WHERE user_id = ? AND campaign_id = ?')
    await stmt.run(userId, campaignId)
  }

  // Check if a user has access to a campaign
  async userHasAccess(userId: string, campaignId: number): Promise<boolean> {
    const stmt = this.db.prepare(`
      SELECT 1 FROM campaign_users
      WHERE user_id = ? AND campaign_id = ?
      LIMIT 1
    `)
    return !!(await stmt.get(userId, campaignId))
  }

  // Get all campaigns a user has access to
  async getUserCampaigns(userId: string): Promise<number[]> {
    const stmt = this.db.prepare(`
      SELECT campaign_id FROM campaign_users
      WHERE user_id = ?
      ORDER BY created_at DESC
    `)
    const results = await stmt.all(userId) as Array<{ campaign_id: number }>
    return results.map(r => r.campaign_id)
  }

  // Get all users who have access to a campaign
  async getCampaignUsers(campaignId: number): Promise<string[]> {
    const stmt = this.db.prepare(`
      SELECT user_id FROM campaign_users
      WHERE campaign_id = ?
      ORDER BY created_at DESC
    `)
    const results = await stmt.all(campaignId) as Array<{ user_id: string }>
    return results.map(r => r.user_id)
  }

  // Assign multiple users to a campaign
  async assignUsersToCampaign(userIds: string[], campaignId: number): Promise<void> {
    for (const userId of userIds) {
      await this.assignUserToCampaign(userId, campaignId)
    }
  }

  // Assign a user to multiple campaigns
  async assignUserToCampaigns(userId: string, campaignIds: number[]): Promise<void> {
    for (const campaignId of campaignIds) {
      await this.assignUserToCampaign(userId, campaignId)
    }
  }

  // Remove all users from a campaign
  async removeAllUsersFromCampaign(campaignId: number): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM campaign_users WHERE campaign_id = ?')
    await stmt.run(campaignId)
  }

  // Remove user from all campaigns
  async removeUserFromAllCampaigns(userId: string): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM campaign_users WHERE user_id = ?')
    await stmt.run(userId)
  }

  // Get campaign access count for a user
  async getUserCampaignCount(userId: string): Promise<number> {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM campaign_users WHERE user_id = ?')
    const result = await stmt.get(userId) as { count: number }
    return result.count
  }

  // Get user count for a campaign
  async getCampaignUserCount(campaignId: number): Promise<number> {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM campaign_users WHERE campaign_id = ?')
    const result = await stmt.get(campaignId) as { count: number }
    return result.count
  }
}

// Export singleton instance
export const campaignAccessService = new CampaignAccessService()
