import { getDatabase } from './db'

export interface MarketingEmailQueueItem {
  id: number
  marketing_email_id: number
  contact_method_id: number
  recipient_email: string
  status: 'pending' | 'processing' | 'sent' | 'failed'
  attempts: number
  last_attempt_at: string | null
  error_message: string | null
  sent_at: string | null
  created_at: string
}

export interface QueueStats {
  total: number
  pending: number
  processing: number
  sent: number
  failed: number
}

class MarketingEmailQueueService {
  private db = getDatabase()

  async populateQueue(
    marketingEmailId: number,
    recipients: Array<{ id: number; value: string }>
  ): Promise<number> {
    if (recipients.length === 0) return 0

    const stmt = this.db.prepare(`
      INSERT INTO marketing_email_queue (marketing_email_id, contact_method_id, recipient_email)
      VALUES (?, ?, ?)
    `)

    let count = 0
    for (const recipient of recipients) {
      await stmt.run(marketingEmailId, recipient.id, recipient.value)
      count++
    }

    return count
  }

  async getPendingItems(limit: number = 10): Promise<MarketingEmailQueueItem[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM marketing_email_queue
      WHERE status = 'pending'
      ORDER BY created_at ASC
      LIMIT ?
    `)
    return await stmt.all(limit) as MarketingEmailQueueItem[]
  }

  async markProcessing(id: number): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE marketing_email_queue
      SET status = 'processing',
          attempts = attempts + 1,
          last_attempt_at = CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
      WHERE id = ?
    `)
    await stmt.run(id)
  }

  async markSent(id: number): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE marketing_email_queue
      SET status = 'sent',
          sent_at = CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
      WHERE id = ?
    `)
    await stmt.run(id)
  }

  async markFailed(id: number, errorMessage: string): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE marketing_email_queue
      SET status = 'failed',
          error_message = ?
      WHERE id = ?
    `)
    await stmt.run(errorMessage, id)
  }

  async resetToRetry(id: number): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE marketing_email_queue
      SET status = 'pending',
          error_message = NULL
      WHERE id = ? AND attempts < 3
    `)
    await stmt.run(id)
  }

  async getQueueStats(marketingEmailId: number): Promise<QueueStats> {
    const stmt = this.db.prepare(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'processing') as processing,
        COUNT(*) FILTER (WHERE status = 'sent') as sent,
        COUNT(*) FILTER (WHERE status = 'failed') as failed
      FROM marketing_email_queue
      WHERE marketing_email_id = ?
    `)
    const result = await stmt.get(marketingEmailId) as QueueStats
    return result
  }

  async hasEmailsInQueue(marketingEmailId: number): Promise<boolean> {
    const stmt = this.db.prepare(`
      SELECT 1 FROM marketing_email_queue
      WHERE marketing_email_id = ? AND status IN ('pending', 'processing')
      LIMIT 1
    `)
    const result = await stmt.get(marketingEmailId)
    return !!result
  }

  async getFailedItems(marketingEmailId: number): Promise<MarketingEmailQueueItem[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM marketing_email_queue
      WHERE marketing_email_id = ? AND status = 'failed'
      ORDER BY created_at ASC
    `)
    return await stmt.all(marketingEmailId) as MarketingEmailQueueItem[]
  }

  async clearQueue(marketingEmailId: number): Promise<void> {
    const stmt = this.db.prepare(`
      DELETE FROM marketing_email_queue
      WHERE marketing_email_id = ?
    `)
    await stmt.run(marketingEmailId)
  }

  async isQueueComplete(marketingEmailId: number): Promise<boolean> {
    const stmt = this.db.prepare(`
      SELECT 1 FROM marketing_email_queue
      WHERE marketing_email_id = ? AND status IN ('pending', 'processing')
      LIMIT 1
    `)
    const result = await stmt.get(marketingEmailId)
    return !result
  }
}

export const marketingEmailQueueService = new MarketingEmailQueueService()
