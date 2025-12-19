import { getDatabase } from './db'

export interface ReminderEmailSent {
  id: number
  subscription_id: number
  sent_date: string
  sent_at: string
}

class ReminderSentService {
  private db = getDatabase()

  // Record that a reminder email was sent
  async recordSent(subscriptionId: number, date: string): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO reminder_emails_sent (subscription_id, sent_date)
      VALUES (?, ?)
      ON CONFLICT (subscription_id, sent_date) DO NOTHING
    `)
    await stmt.run(subscriptionId, date)
  }

  // Check if a reminder was already sent for this subscription on this date
  async wasSent(subscriptionId: number, date: string): Promise<boolean> {
    const stmt = this.db.prepare(`
      SELECT 1 FROM reminder_emails_sent
      WHERE subscription_id = ? AND sent_date = ?
    `)
    const result = await stmt.get(subscriptionId, date)
    return !!result
  }

  // Get all sent records for a subscription (for debugging/history)
  async getSentHistory(subscriptionId: number, limit: number = 30): Promise<ReminderEmailSent[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM reminder_emails_sent
      WHERE subscription_id = ?
      ORDER BY sent_date DESC
      LIMIT ?
    `)
    return await stmt.all(subscriptionId, limit) as ReminderEmailSent[]
  }

  // Clean up old records (older than specified days)
  async cleanupOldRecords(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0]

    const stmt = this.db.prepare(`
      DELETE FROM reminder_emails_sent
      WHERE sent_date < ?
    `)
    const result = await stmt.run(cutoffDateStr)
    return result.changes
  }
}

export const reminderSentService = new ReminderSentService()
