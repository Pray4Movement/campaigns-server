import { getDatabase } from './db'

export interface Contact {
  id: number
  name: string
  email_address: string | null
  phone: string | null
  role: string | null
  created_at: string
  updated_at: string
}

export interface CreateContactData {
  name: string
  email_address?: string | null
  phone?: string | null
  role?: string | null
}

export interface UpdateContactData {
  name?: string
  email_address?: string | null
  phone?: string | null
  role?: string | null
}

class ContactService {
  private db = getDatabase()

  async create(data: CreateContactData): Promise<Contact> {
    const stmt = this.db.prepare(`
      INSERT INTO contacts (name, email_address, phone, role)
      VALUES (?, ?, ?, ?)
    `)
    const result = await stmt.run(data.name, data.email_address || null, data.phone || null, data.role || null)
    return (await this.getById(result.lastInsertRowid as number))!
  }

  async getById(id: number): Promise<Contact | null> {
    const stmt = this.db.prepare('SELECT * FROM contacts WHERE id = ?')
    return await stmt.get(id) as Contact | null
  }

  async getByEmail(email: string): Promise<Contact | null> {
    const stmt = this.db.prepare('SELECT * FROM contacts WHERE LOWER(email_address) = LOWER(?)')
    return await stmt.get(email) as Contact | null
  }

  async getAll(options?: {
    search?: string
    limit?: number
    offset?: number
  }): Promise<Contact[]> {
    let query = 'SELECT * FROM contacts'
    const params: any[] = []

    if (options?.search) {
      query += ' WHERE name ILIKE ? OR email_address ILIKE ? OR phone ILIKE ?'
      const term = `%${options.search}%`
      params.push(term, term, term)
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
    return await stmt.all(...params) as Contact[]
  }

  async count(search?: string): Promise<number> {
    let query = 'SELECT COUNT(*) as count FROM contacts'
    const params: any[] = []

    if (search) {
      query += ' WHERE name ILIKE ? OR email_address ILIKE ? OR phone ILIKE ?'
      const term = `%${search}%`
      params.push(term, term, term)
    }

    const stmt = this.db.prepare(query)
    const result = await stmt.get(...params) as { count: string | number }
    return Number(result.count)
  }

  async update(id: number, data: UpdateContactData): Promise<Contact | null> {
    const contact = await this.getById(id)
    if (!contact) return null

    const updates: string[] = []
    const values: any[] = []

    if (data.name !== undefined) {
      updates.push('name = ?')
      values.push(data.name)
    }
    if (data.email_address !== undefined) {
      updates.push('email_address = ?')
      values.push(data.email_address)
    }
    if (data.phone !== undefined) {
      updates.push('phone = ?')
      values.push(data.phone)
    }
    if (data.role !== undefined) {
      updates.push('role = ?')
      values.push(data.role)
    }

    if (updates.length === 0) return contact

    updates.push("updated_at = CURRENT_TIMESTAMP AT TIME ZONE 'UTC'")
    values.push(id)

    const stmt = this.db.prepare(`
      UPDATE contacts SET ${updates.join(', ')} WHERE id = ?
    `)
    await stmt.run(...values)
    return this.getById(id)
  }

  async delete(id: number): Promise<boolean> {
    const stmt = this.db.prepare('DELETE FROM contacts WHERE id = ?')
    const result = await stmt.run(id)
    return result.changes > 0
  }
}

export const contactService = new ContactService()
