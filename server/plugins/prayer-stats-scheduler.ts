import { updatePrayerStats } from '../utils/prayer-stats'

/**
 * Nitro plugin to update campaign prayer stats daily
 *
 * This plugin runs when the server starts and checks every hour
 * to see if it's time to update stats (at 3 AM daily)
 */
export default defineNitroPlugin((nitroApp) => {
  if (process.env.VITEST) return

  console.log('📅 Scheduling prayer stats updates (daily at 3 AM)')

  let lastUpdateDate: string | null = null

  // Run once on startup to ensure stats are populated
  setTimeout(async () => {
    console.log('🔄 Running initial prayer stats update...')
    try {
      await updatePrayerStats()
      lastUpdateDate = new Date().toISOString().split('T')[0]
      console.log('✅ Initial prayer stats update completed')
    } catch (error: any) {
      console.error('❌ Initial prayer stats update failed:', error.message)
    }
  }, 5000) // Wait 5 seconds for database to be ready

  // Check every hour if we need to run an update
  const interval = setInterval(async () => {
    const now = new Date()
    const hour = now.getHours()
    const dateKey = now.toISOString().split('T')[0]

    // Run update at 3 AM if we haven't already today
    if (hour === 3 && lastUpdateDate !== dateKey) {
      console.log('🔄 Starting scheduled prayer stats update...')

      try {
        await updatePrayerStats()
        lastUpdateDate = dateKey
        console.log('✅ Scheduled prayer stats update completed')
      } catch (error: any) {
        console.error('❌ Scheduled prayer stats update failed:', error.message)
      }
    }
  }, 60 * 60 * 1000) // Check every hour

  console.log('✅ Prayer stats scheduler initialized')

  // Cleanup on server shutdown
  nitroApp.hooks.hook('close', () => {
    console.log('🛑 Stopping prayer stats scheduler...')
    clearInterval(interval)
  })
})
