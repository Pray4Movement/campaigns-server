import { reminderSignupService } from '../database/reminder-signups'
import { reminderSentService } from '../database/reminder-sent'
import { campaignService } from '../database/campaigns'
import { prayerContentService } from '../database/prayer-content'
import { sendPrayerReminderEmail } from '../utils/prayer-reminder-email'

/**
 * Nitro plugin to schedule prayer reminder emails
 *
 * This plugin runs when the server starts and checks every 5 minutes
 * for users whose next_reminder_utc has passed.
 */
export default defineNitroPlugin((nitroApp) => {
  // Check if reminders are enabled (defaults to true)
  const enableReminders = process.env.ENABLE_REMINDER_EMAILS !== 'false'

  if (!enableReminders) {
    console.log('⏸️  Prayer reminder emails disabled')
    console.log('   Set ENABLE_REMINDER_EMAILS=true to enable')
    return
  }

  console.log('📧 Scheduling prayer reminder emails (checking every 5 minutes)')

  // Track if we're currently processing to avoid overlapping runs
  let isProcessing = false

  // Check every 5 minutes for reminders to send
  const interval = setInterval(async () => {
    if (isProcessing) {
      return
    }

    isProcessing = true

    try {
      await processReminders()
    } catch (error: any) {
      console.error('❌ Reminder scheduler error:', error.message)
    } finally {
      isProcessing = false
    }
  }, 5 * 60 * 1000) // 5 minutes

  // Also run immediately on startup (after a short delay to let the server initialize)
  setTimeout(async () => {
    if (!isProcessing) {
      isProcessing = true
      try {
        await processReminders()
      } catch (error: any) {
        console.error('❌ Initial reminder check error:', error.message)
      } finally {
        isProcessing = false
      }
    }
  }, 10000) // 10 seconds after startup

  console.log('✅ Reminder scheduler initialized')

  // Cleanup on server shutdown
  nitroApp.hooks.hook('close', () => {
    console.log('🛑 Stopping reminder scheduler...')
    clearInterval(interval)
  })
})

/**
 * Process all reminders that are due
 */
async function processReminders() {
  const todayDate = new Date().toISOString().split('T')[0]

  // Get all signups that are due for a reminder
  const dueSignups = await reminderSignupService.getSignupsDueForReminder()

  if (dueSignups.length === 0) {
    return
  }

  console.log(`📧 Processing ${dueSignups.length} reminder(s)...`)

  // Group signups by campaign_id for efficient content fetching
  const signupsByCampaign = new Map<number, typeof dueSignups>()
  for (const signup of dueSignups) {
    if (!signupsByCampaign.has(signup.campaign_id)) {
      signupsByCampaign.set(signup.campaign_id, [])
    }
    signupsByCampaign.get(signup.campaign_id)!.push(signup)
  }

  // Process each campaign's signups
  for (const [campaignId, signups] of signupsByCampaign) {
    try {
      // Get campaign info
      const campaign = await campaignService.getCampaignById(campaignId)
      if (!campaign) {
        console.error(`Campaign ${campaignId} not found, skipping ${signups.length} signups`)
        continue
      }

      // Get today's prayer content (all content for this date)
      const prayerContent = await prayerContentService.getAllPrayerContentByDate(
        campaignId,
        todayDate,
        campaign.default_language || 'en'
      )

      // Send reminder to each signup
      for (const signup of signups) {
        try {
          // Check if we already sent today (double-check to prevent duplicates)
          const alreadySent = await reminderSentService.wasSent(signup.id, todayDate)
          if (alreadySent) {
            // Update next reminder time anyway
            await reminderSignupService.setNextReminderAfterSend(signup.id)
            continue
          }

          // Send the email
          const emailSent = await sendPrayerReminderEmail({
            to: signup.email,
            subscriberName: signup.name,
            campaignTitle: campaign.title,
            campaignSlug: campaign.slug,
            trackingId: signup.tracking_id,
            prayerDuration: signup.prayer_duration,
            prayerContent: prayerContent.length > 0 ? prayerContent : null
          })

          if (emailSent) {
            // Record that we sent this reminder
            await reminderSentService.recordSent(signup.id, todayDate)
            // Update next reminder time
            await reminderSignupService.setNextReminderAfterSend(signup.id)
            console.log(`  ✅ Sent reminder to ${signup.email} for ${campaign.title}`)
          } else {
            console.error(`  ❌ Failed to send reminder to ${signup.email}`)
          }
        } catch (error: any) {
          console.error(`  ❌ Error processing signup ${signup.id}:`, error.message)
        }
      }
    } catch (error: any) {
      console.error(`❌ Error processing campaign ${campaignId}:`, error.message)
    }
  }

  console.log(`📧 Reminder processing complete`)
}
