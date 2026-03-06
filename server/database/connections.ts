import { getDatabase } from './db'

export interface Connection {
  id: number
  from_type: string
  from_id: number
  to_type: string
  to_id: number
  connection_type: string | null
  created_at: string
}

class ConnectionService {
  private db = getDatabase()

  async create(data: {
    from_type: string
    from_id: number
    to_type: string
    to_id: number
    connection_type?: string | null
  }): Promise<Connection> {
    const stmt = this.db.prepare(`
      INSERT INTO connections (from_type, from_id, to_type, to_id, connection_type)
      VALUES (?, ?, ?, ?, ?)
    `)
    const result = await stmt.run(
      data.from_type, data.from_id,
      data.to_type, data.to_id,
      data.connection_type || null
    )
    return (await this.getById(result.lastInsertRowid as number))!
  }

  async getById(id: number): Promise<Connection | null> {
    const stmt = this.db.prepare('SELECT * FROM connections WHERE id = ?')
    return await stmt.get(id) as Connection | null
  }

  async getConnections(type: string, id: number, targetType: string): Promise<Connection[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM connections
      WHERE (from_type = ? AND from_id = ? AND to_type = ?)
         OR (to_type = ? AND to_id = ? AND from_type = ?)
      ORDER BY created_at DESC
    `)
    return await stmt.all(type, id, targetType, type, id, targetType) as Connection[]
  }

  async getContactsForGroup(groupId: number): Promise<{ contact_id: number; name: string; email_address: string | null; phone: string | null; connection_type: string | null }[]> {
    const stmt = this.db.prepare(`
      SELECT c.id as contact_id, c.name, c.email_address, c.phone, conn.connection_type
      FROM connections conn
      JOIN contacts c ON c.id = conn.from_id
      WHERE conn.from_type = 'contact' AND conn.to_type = 'group' AND conn.to_id = ?
      ORDER BY c.name
    `)
    return await stmt.all(groupId) as any[]
  }

  async getGroupsForContact(contactId: number): Promise<{ group_id: number; name: string; connection_type: string | null }[]> {
    const stmt = this.db.prepare(`
      SELECT g.id as group_id, g.name, conn.connection_type
      FROM connections conn
      JOIN groups g ON g.id = conn.to_id
      WHERE conn.from_type = 'contact' AND conn.to_type = 'group' AND conn.from_id = ?
      ORDER BY g.name
    `)
    return await stmt.all(contactId) as any[]
  }

  async delete(id: number): Promise<boolean> {
    const stmt = this.db.prepare('DELETE FROM connections WHERE id = ?')
    const result = await stmt.run(id)
    return result.changes > 0
  }

  async deleteByEntities(fromType: string, fromId: number, toType: string, toId: number): Promise<boolean> {
    const stmt = this.db.prepare(`
      DELETE FROM connections
      WHERE from_type = ? AND from_id = ? AND to_type = ? AND to_id = ?
    `)
    const result = await stmt.run(fromType, fromId, toType, toId)
    return result.changes > 0
  }
}

export const connectionService = new ConnectionService()
