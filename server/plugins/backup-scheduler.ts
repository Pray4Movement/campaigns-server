import cron from 'node-cron'
import { createDatabaseBackup } from '../utils/backup'

/**
 * Nitro plugin to schedule automatic daily database backups
 *
 * This plugin runs when the server starts and sets up a cron job
 * to automatically backup the database every day at 2 AM (server time)
 */
export default defineNitroPlugin((nitroApp) => {
  // Only run scheduled backups in production or if explicitly enabled
  const enableScheduledBackups = process.env.ENABLE_SCHEDULED_BACKUPS === 'true'
  const isProduction = process.env.NODE_ENV === 'production'

  if (!enableScheduledBackups && !isProduction) {
    console.log('⏸️  Scheduled backups disabled in development mode')
    console.log('   Set ENABLE_SCHEDULED_BACKUPS=true to enable in development')
    return
  }

  // Schedule daily backup at 2 AM
  // Cron format: minute hour day month day-of-week
  // '0 2 * * *' = At 02:00 every day
  const cronSchedule = process.env.BACKUP_CRON_SCHEDULE || '0 2 * * *'

  console.log(`📅 Scheduling automatic database backups: ${cronSchedule}`)

  const task = cron.schedule(cronSchedule, async () => {
    console.log('🔄 Starting scheduled database backup...')

    try {
      const result = await createDatabaseBackup()

      if (result.success) {
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
  }, {
    scheduled: true,
    timezone: process.env.BACKUP_TIMEZONE || 'UTC'
  })

  console.log('✅ Backup scheduler initialized')

  // Cleanup on server shutdown
  nitroApp.hooks.hook('close', () => {
    console.log('🛑 Stopping backup scheduler...')
    task.stop()
  })
})
