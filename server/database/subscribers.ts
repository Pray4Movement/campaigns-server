import { getDatabase } from './db'
import { randomUUID } from 'crypto'
import { contactMethodService } from './contact-methods'

export interface Subscriber {
  id: number
  tracking_id: string
  name: string
  created_at: string
  updated_at: string
}

export interface SubscriberWithContacts extends Subscriber {
  contacts: {
    id: number
    type: 'email' | 'phone'
    value: string
    verified: boolean
  }[]
}

class SubscriberService {
  private db = getDatabase()

  async createSubscriber(name: string): Promise<Subscriber> {
    const tracking_id = randomUUID()

    const stmt = this.db.prepare(`
      INSERT INTO subscribers (tracking_id, name)
      VALUES (?, ?)
    `)

    const result = await stmt.run(tracking_id, name)
    return (await this.getSubscriberById(result.lastInsertRowid as number))!
  }

  async getSubscriberById(id: number): Promise<Subscriber | null> {
    const stmt = this.db.prepare('SELECT * FROM subscribers WHERE id = ?')
    return await stmt.get(id) as Subscriber | null
  }

  async getSubscriberByTrackingId(trackingId: string): Promise<Subscriber | null> {
    const stmt = this.db.prepare('SELECT * FROM subscribers WHERE tracking_id = ?')
    return await stmt.get(trackingId) as Subscriber | null
  }

  async getSubscriberWithContacts(trackingId: string): Promise<SubscriberWithContacts | null> {
    const subscriber = await this.getSubscriberByTrackingId(trackingId)
    if (!subscriber) return null

    const contacts = await contactMethodService.getSubscriberContactMethods(subscriber.id)

    return {
      ...subscriber,
      contacts: contacts.map(c => ({
        id: c.id,
        type: c.type,
        value: c.value,
        verified: c.verified
      }))
    }
  }

  async updateSubscriber(id: number, updates: { name?: string }): Promise<Subscriber | null> {
    const fields: string[] = []
    const values: any[] = []

    if (updates.name !== undefined) {
      fields.push('name = ?')
      values.push(updates.name)
    }

    if (fields.length === 0) {
      return this.getSubscriberById(id)
    }

    fields.push("updated_at = CURRENT_TIMESTAMP AT TIME ZONE 'UTC'")
    values.push(id)

    const stmt = this.db.prepare(`
      UPDATE subscribers
      SET ${fields.join(', ')}
      WHERE id = ?
    `)
    await stmt.run(...values)

    return this.getSubscriberById(id)
  }

  async deleteSubscriber(id: number): Promise<boolean> {
    const stmt = this.db.prepare('DELETE FROM subscribers WHERE id = ?')
    const result = await stmt.run(id)
    return result.changes > 0
  }

  /**
   * Find an existing subscriber by email or phone, or create a new one.
   * This is the main entry point for the signup flow.
   */
  async findOrCreateSubscriber(input: {
    email?: string
    phone?: string
    name: string
  }): Promise<{ subscriber: Subscriber; isNew: boolean }> {
    // 1. Try to find by email (case-insensitive)
    if (input.email) {
      const emailContact = await contactMethodService.getByValue('email', input.email)
      if (emailContact) {
        const subscriber = await this.getSubscriberById(emailContact.subscriber_id)
        if (subscriber) {
          return { subscriber, isNew: false }
        }
      }
    }

    // 2. Try to find by phone
    if (input.phone) {
      const phoneContact = await contactMethodService.getByValue('phone', input.phone)
      if (phoneContact) {
        const subscriber = await this.getSubscriberById(phoneContact.subscriber_id)
        if (subscriber) {
          return { subscriber, isNew: false }
        }
      }
    }

    // 3. Create new subscriber with contact methods
    const subscriber = await this.createSubscriber(input.name)

    if (input.email) {
      await contactMethodService.addContactMethod(subscriber.id, 'email', input.email)
    }
    if (input.phone) {
      await contactMethodService.addContactMethod(subscriber.id, 'phone', input.phone)
    }

    return { subscriber, isNew: true }
  }

  /**
   * Get all subscribers (for admin listing)
   */
  async getAllSubscribers(options?: {
    limit?: number
    offset?: number
    search?: string
  }): Promise<Subscriber[]> {
    let query = 'SELECT * FROM subscribers'
    const params: any[] = []

    if (options?.search) {
      query += ' WHERE name ILIKE ?'
      params.push(`%${options.search}%`)
    }

    query += ' ORDER BY created_at DESC'

    if (options?.limit) {
      query += ' LIMIT ?'
      params.push(options.limit)

      if (options?.offset) {
        query += ' OFFSET ?'
        params.push(options.offset)
      }
    }

    const stmt = this.db.prepare(query)
    return await stmt.all(...params) as Subscriber[]
  }

  async getSubscriberCount(): Promise<number> {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM subscribers')
    const result = await stmt.get() as { count: number }
    return result.count
  }
}

export const subscriberService = new SubscriberService()
