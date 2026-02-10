import { getDatabase } from './db'
import bcrypt from 'bcrypt'
import { randomBytes } from 'crypto'

const SALT_ROUNDS = 12
const KEY_PREFIX = 'dxk_'

export interface ApiKey {
  id: number
  user_id: string
  name: string
  key_prefix: string
  created_at: string
  last_used_at: string | null
  revoked_at: string | null
}

export interface ApiKeyCandidate {
  id: number
  user_id: string
  key_hash: string
}

export class ApiKeyService {
  private db = getDatabase()

  generateKey(): { key: string; keyPrefix: string; keyHash: Promise<string> } {
    const raw = randomBytes(20).toString('hex') // 40 hex chars
    const key = `${KEY_PREFIX}${raw}`
    const keyPrefix = key.substring(0, 8)
    const keyHash = bcrypt.hash(key, SALT_ROUNDS)
    return { key, keyPrefix, keyHash }
  }

  async createApiKey(userId: string, name: string): Promise<{ apiKey: ApiKey; plaintextKey: string }> {
    const { key, keyPrefix, keyHash } = this.generateKey()
    const hash = await keyHash

    const stmt = this.db.prepare(`
      INSERT INTO api_keys (user_id, name, key_hash, key_prefix)
      VALUES (?, ?, ?, ?)
    `)

    const result = await stmt.run(userId, name, hash, keyPrefix)

    const apiKey = await this.db.prepare(`
      SELECT id, user_id, name, key_prefix, created_at, last_used_at, revoked_at
      FROM api_keys WHERE id = ?
    `).get(result.lastInsertRowid)

    return { apiKey: apiKey as ApiKey, plaintextKey: key }
  }

  async getUserApiKeys(userId: string): Promise<ApiKey[]> {
    const stmt = this.db.prepare(`
      SELECT id, user_id, name, key_prefix, created_at, last_used_at, revoked_at
      FROM api_keys
      WHERE user_id = ? AND revoked_at IS NULL
      ORDER BY created_at DESC
    `)

    return await stmt.all(userId) as ApiKey[]
  }

  async findActiveKeysByPrefix(prefix: string): Promise<ApiKeyCandidate[]> {
    const stmt = this.db.prepare(`
      SELECT id, user_id, key_hash
      FROM api_keys
      WHERE key_prefix = ? AND revoked_at IS NULL
    `)

    return await stmt.all(prefix) as ApiKeyCandidate[]
  }

  async verifyKey(rawKey: string, keyHash: string): Promise<boolean> {
    return bcrypt.compare(rawKey, keyHash)
  }

  async updateLastUsed(id: number): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE api_keys SET last_used_at = (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
      WHERE id = ?
    `)
    await stmt.run(id)
  }

  async revokeApiKey(id: number, userId: string): Promise<boolean> {
    const stmt = this.db.prepare(`
      UPDATE api_keys SET revoked_at = (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
      WHERE id = ? AND user_id = ? AND revoked_at IS NULL
    `)

    const result = await stmt.run(id, userId)
    return result.changes > 0
  }
}

export const apiKeyService = new ApiKeyService()
