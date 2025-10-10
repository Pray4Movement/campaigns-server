import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { exec } from 'child_process'
import { promisify } from 'util'
import { readFile, unlink } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'

const execAsync = promisify(exec)

interface BackupOptions {
  filename?: string
  deleteLocal?: boolean
}

interface BackupResult {
  success: boolean
  filename: string
  size?: number
  error?: string
  s3Location?: string
}

/**
 * Create a PostgreSQL database backup and upload it to S3
 * @param options - Backup configuration options
 * @returns Promise with backup result
 */
export async function createDatabaseBackup(options: BackupOptions = {}): Promise<BackupResult> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = options.filename || `backup-${timestamp}.sql`
  const localPath = join(tmpdir(), filename)

  try {
    // Get database configuration from environment
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set')
    }

    // Parse PostgreSQL connection string
    const dbUrl = new URL(databaseUrl)
    const dbHost = dbUrl.hostname
    const dbPort = dbUrl.port || '5432'
    const dbName = dbUrl.pathname.slice(1) // Remove leading slash
    const dbUser = dbUrl.username
    const dbPassword = dbUrl.password

    // Create pg_dump command
    // Using custom format (-Fc) for better compression and flexibility
    const pgDumpCommand = `PGPASSWORD="${dbPassword}" pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -Fc -f "${localPath}" ${dbName}`

    console.log(`Creating database backup: ${filename}`)
    await execAsync(pgDumpCommand)

    // Read the backup file
    const backupData = await readFile(localPath)
    const fileSize = backupData.length

    console.log(`Backup created successfully: ${fileSize} bytes`)

    // Upload to S3
    const s3Location = await uploadBackupToS3(filename, backupData)

    // Delete local file if requested
    if (options.deleteLocal !== false) {
      await unlink(localPath)
      console.log(`Local backup file deleted: ${localPath}`)
    }

    return {
      success: true,
      filename,
      size: fileSize,
      s3Location
    }
  } catch (error: any) {
    console.error('Backup failed:', error)

    // Clean up local file on error
    try {
      await unlink(localPath)
    } catch (cleanupError) {
      // Ignore cleanup errors
    }

    return {
      success: false,
      filename,
      error: error.message || 'Unknown error occurred'
    }
  }
}

/**
 * Upload backup file to S3 or S3-compatible storage
 * @param filename - Name of the backup file
 * @param data - File data buffer
 * @returns S3 location URL
 */
async function uploadBackupToS3(filename: string, data: Buffer): Promise<string> {
  const accessKeyId = process.env.S3_ACCESS_KEY_ID
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY
  const region = process.env.S3_REGION || 'us-east-1'
  const bucket = process.env.S3_BACKUP_BUCKET
  const endpoint = process.env.S3_ENDPOINT

  if (!accessKeyId || !secretAccessKey || !bucket) {
    throw new Error('S3 credentials or bucket name not configured in environment variables')
  }

  // Initialize S3 client with optional custom endpoint
  const s3ClientConfig: any = {
    region,
    credentials: {
      accessKeyId,
      secretAccessKey
    }
  }

  // Add custom endpoint if provided (for S3-compatible services)
  if (endpoint) {
    s3ClientConfig.endpoint = endpoint
    // Force path-style addressing for compatibility with some S3-compatible services
    s3ClientConfig.forcePathStyle = true
  }

  const s3Client = new S3Client(s3ClientConfig)

  // Upload to S3
  const key = `database-backups/${filename}`
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: data,
    ContentType: 'application/sql',
    ServerSideEncryption: 'AES256'
  })

  await s3Client.send(command)

  const s3Location = `s3://${bucket}/${key}`
  console.log(`Backup uploaded to S3: ${s3Location}`)

  return s3Location
}

/**
 * Restore database from a backup file on S3
 * Note: This is a helper function for manual restoration
 * @param filename - Name of the backup file in S3
 */
export async function restoreDatabaseFromBackup(filename: string): Promise<void> {
  // TODO: Implement restoration logic if needed
  // This would involve downloading from S3 and using pg_restore
  throw new Error('Restore functionality not yet implemented')
}
