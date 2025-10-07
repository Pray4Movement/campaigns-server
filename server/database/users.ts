import { getDatabase } from './db'
import bcrypt from 'bcrypt'
import { v4 as uuidv4 } from 'uuid'

export interface User {
  id: number
  email: string
  display_name: string
  verified: boolean
  superadmin: boolean
  token_key: string
  created_at: string
  updated_at: string
}

export interface CreateUserData {
  email: string
  password: string
  display_name?: string
}

const SALT_ROUNDS = 12

export class UserService {
  private db = getDatabase()

  // Create a new user
  async createUser(userData: CreateUserData): Promise<User> {
    const { email, password, display_name = '' } = userData
    
    // Hash the password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
    
    // Generate unique token key
    const tokenKey = uuidv4()
    
    const stmt = this.db.prepare(`
      INSERT INTO users (email, password_hash, display_name, token_key)
      VALUES (?, ?, ?, ?)
    `)
    
    try {
      const result = stmt.run(email, passwordHash, display_name, tokenKey)
      return this.getUserById(result.lastInsertRowid as number)!
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        throw new Error('User with this email already exists')
      }
      throw error
    }
  }

  // Get user by ID
  getUserById(id: number): User | null {
    const stmt = this.db.prepare(`
      SELECT id, email, display_name, verified, superadmin, token_key, created_at, updated_at
      FROM users
      WHERE id = ?
    `)
    
    return stmt.get(id) as User | null
  }

  // Get user by email
  getUserByEmail(email: string): User | null {
    const stmt = this.db.prepare(`
      SELECT id, email, display_name, verified, superadmin, token_key, created_at, updated_at
      FROM users
      WHERE email = ?
    `)
    
    return stmt.get(email) as User | null
  }

  // Get user by token key (for email verification)
  getUserByTokenKey(tokenKey: string): User | null {
    const stmt = this.db.prepare(`
      SELECT id, email, display_name, verified, superadmin, token_key, created_at, updated_at
      FROM users
      WHERE token_key = ?
    `)
    
    return stmt.get(tokenKey) as User | null
  }

  // Verify user password
  async verifyPassword(email: string, password: string): Promise<User | null> {
    const stmt = this.db.prepare(`
      SELECT id, email, display_name, verified, superadmin, token_key, password_hash, created_at, updated_at
      FROM users
      WHERE email = ?
    `)
    
    const user = stmt.get(email) as (User & { password_hash: string }) | null
    
    if (!user) {
      return null
    }

    const isValid = await bcrypt.compare(password, user.password_hash)
    
    if (!isValid) {
      return null
    }

    // Return user without password hash
    const { password_hash, ...userWithoutPassword } = user
    return userWithoutPassword
  }

  // Get all users (for admin purposes)
  getAllUsers(): User[] {
    const stmt = this.db.prepare(`
      SELECT id, email, display_name, verified, superadmin, token_key, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
    `)
    
    return stmt.all() as User[]
  }

  // Update token key (for security rotation)
  updateTokenKey(id: number): string {
    const newTokenKey = uuidv4()
    const stmt = this.db.prepare(`
      UPDATE users SET token_key = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    
    stmt.run(newTokenKey, id)
    return newTokenKey
  }

  // Mark user as verified
  verifyUser(id: number): boolean {
    const stmt = this.db.prepare(`
      UPDATE users SET verified = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    
    const result = stmt.run(id)
    return result.changes > 0
  }

  // Delete user
  deleteUser(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM users WHERE id = ?')
    const result = stmt.run(id)
    return result.changes > 0
  }
}

// Export singleton instance
export const userService = new UserService()