import { getDatabase } from './db'

export interface PeopleGroupAccess {
  people_group_id: number
  user_id: string
  created_at: string
}

export class PeopleGroupAccessService {
  private db = getDatabase()

  async assignUserToPeopleGroup(userId: string, peopleGroupId: number): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO campaign_users (user_id, people_group_id)
      VALUES (?, ?)
      ON CONFLICT DO NOTHING
    `)
    await stmt.run(userId, peopleGroupId)
  }

  async removeUserFromPeopleGroup(userId: string, peopleGroupId: number): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM campaign_users WHERE user_id = ? AND people_group_id = ?')
    await stmt.run(userId, peopleGroupId)
  }

  async userHasAccess(userId: string, peopleGroupId: number): Promise<boolean> {
    const stmt = this.db.prepare(`
      SELECT 1 FROM campaign_users
      WHERE user_id = ? AND people_group_id = ?
      LIMIT 1
    `)
    return !!(await stmt.get(userId, peopleGroupId))
  }

  async getUserPeopleGroups(userId: string): Promise<number[]> {
    const stmt = this.db.prepare(`
      SELECT people_group_id FROM campaign_users
      WHERE user_id = ?
      ORDER BY created_at DESC
    `)
    const results = await stmt.all(userId) as Array<{ people_group_id: number }>
    return results.map(r => r.people_group_id)
  }

  async getPeopleGroupUsers(peopleGroupId: number): Promise<string[]> {
    const stmt = this.db.prepare(`
      SELECT user_id FROM campaign_users
      WHERE people_group_id = ?
      ORDER BY created_at DESC
    `)
    const results = await stmt.all(peopleGroupId) as Array<{ user_id: string }>
    return results.map(r => r.user_id)
  }

  async assignUsersToPeopleGroup(userIds: string[], peopleGroupId: number): Promise<void> {
    for (const userId of userIds) {
      await this.assignUserToPeopleGroup(userId, peopleGroupId)
    }
  }

  async assignUserToPeopleGroups(userId: string, peopleGroupIds: number[]): Promise<void> {
    for (const peopleGroupId of peopleGroupIds) {
      await this.assignUserToPeopleGroup(userId, peopleGroupId)
    }
  }

  async removeAllUsersFromPeopleGroup(peopleGroupId: number): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM campaign_users WHERE people_group_id = ?')
    await stmt.run(peopleGroupId)
  }

  async removeUserFromAllPeopleGroups(userId: string): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM campaign_users WHERE user_id = ?')
    await stmt.run(userId)
  }

  async getUserPeopleGroupCount(userId: string): Promise<number> {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM campaign_users WHERE user_id = ?')
    const result = await stmt.get(userId) as { count: number }
    return result.count
  }

  async getPeopleGroupUserCount(peopleGroupId: number): Promise<number> {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM campaign_users WHERE people_group_id = ?')
    const result = await stmt.get(peopleGroupId) as { count: number }
    return result.count
  }
}

export const peopleGroupAccessService = new PeopleGroupAccessService()
