import Database from 'better-sqlite3'
import { readFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

let db: Database.Database | null = null

export function getDatabase(): Database.Database {
  if (!db) {
    // Create database file in data directory (Nuxt 4.1 best practice)
    const dataDir = join(process.cwd(), 'data')
    const dbPath = join(dataDir, 'database.sqlite')
    
    // Ensure data directory exists
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true })
    }
    
    db = new Database(dbPath)
    
    // Enable WAL mode for better concurrent access
    db.pragma('journal_mode = WAL')
    
    // Initialize schema
    initializeDatabase()
  }
  
  return db
}

function initializeDatabase() {
  if (!db) return
  
  try {
    // Read and execute schema
    const schemaPath = join(process.cwd(), 'server/database/schema.sql')
    const schema = readFileSync(schemaPath, 'utf-8')
    
    // Execute schema (split by semicolon to handle multiple statements)
    const statements = schema.split(';').filter(stmt => stmt.trim())
    
    for (const statement of statements) {
      if (statement.trim()) {
        db.exec(statement)
      }
    }
    
    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Error initializing database:', error)
    throw error
  }
}

export function closeDatabase() {
  if (db) {
    db.close()
    db = null
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  closeDatabase()
  process.exit(0)
})

process.on('SIGTERM', () => {
  closeDatabase()
  process.exit(0)
})