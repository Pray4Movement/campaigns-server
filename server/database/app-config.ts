import { getDatabase } from './db'

export interface AppConfig {
  key: string
  value: string
  updated_at: string
}

export class AppConfigService {
  private db = getDatabase()

  // Get config value by key and parse as JSON
  async getConfig<T = any>(key: string): Promise<T | null> {
    const stmt = this.db.prepare('SELECT value FROM app_config WHERE key = ?')
    const result = await stmt.get(key) as { value: string } | null

    if (!result?.value) {
      return null
    }

    try {
      return JSON.parse(result.value) as T
    } catch (error) {
      console.error(`Failed to parse config for key "${key}":`, error)
      return null
    }
  }

  // Set config value (automatically stringifies JSON)
  async setConfig(key: string, value: any): Promise<void> {
    const valueString = JSON.stringify(value)

    // Check if config exists
    const existing = await this.getConfig(key)

    if (existing !== null) {
      // Update existing
      const stmt = this.db.prepare(`
        UPDATE app_config
        SET value = ?, updated_at = CURRENT_TIMESTAMP
        WHERE key = ?
      `)
      await stmt.run(valueString, key)
    } else {
      // Insert new
      const stmt = this.db.prepare(`
        INSERT INTO app_config (key, value)
        VALUES (?, ?)
      `)
      await stmt.run(key, valueString)
    }
  }
}

// Export singleton instance
export const appConfigService = new AppConfigService()
