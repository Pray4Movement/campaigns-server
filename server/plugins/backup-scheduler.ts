import { createDatabaseBackup } from '../utils/backup'

/**
 * Nitro plugin to schedule automatic daily database backups
 *
 * This plugin runs when the server starts and checks every hour
 * to see if it's time to run a backup (at 2 AM daily)
 */
export default defineNitroPlugin((nitroApp) => {
  if (process.env.VITEST) return

  // Only run scheduled backups in production or if explicitly enabled
  const enableScheduledBackups = process.env.ENABLE_SCHEDULED_BACKUPS === 'true'
  const isProduction = process.env.NODE_ENV === 'production'

  if (!enableScheduledBackups && !isProduction) {
    console.log('⏸️  Scheduled backups disabled in development mode')
    console.log('   Set ENABLE_SCHEDULED_BACKUPS=true to enable in development')
    return
  }

  console.log('📅 Scheduling automatic database backups (daily at 2 AM)')

  let lastBackupDate: string | null = null

  // Check every hour if we need to run a backup
  const interval = setInterval(async () => {
    const now = new Date()
    const hour = now.getHours()
    const dateKey = now.toISOString().split('T')[0]

    // Run backup at 2 AM if we haven't already today
    if (hour === 2 && lastBackupDate !== dateKey) {
      console.log('🔄 Starting scheduled database backup...')

      try {
        const result = await createDatabaseBackup()

        if (result.success) {
          lastBackupDate = dateKey
          console.log(`✅ Scheduled backup completed successfully`)
          console.log(`   File: ${result.filename}`)
          console.log(`   Size: ${(result.size! / 1024 / 1024).toFixed(2)} MB`)
          console.log(`   Location: ${result.s3Location}`)
        } else {
          console.error(`❌ Scheduled backup failed: ${result.error}`)
        }
      } catch (error: any) {
        console.error('❌ Scheduled backup error:', error.message)
      }
    }
  }, 60 * 60 * 1000) // Check every hour

  console.log('✅ Backup scheduler initialized')

  // Cleanup on server shutdown
  nitroApp.hooks.hook('close', () => {
    console.log('🛑 Stopping backup scheduler...')
    clearInterval(interval)
  })
})
