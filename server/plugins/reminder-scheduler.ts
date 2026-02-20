import { peopleGroupSubscriptionService } from '../database/people-group-subscriptions'
import { reminderSentService } from '../database/reminder-sent'
import { peopleGroupService } from '../database/people-groups'
import { prayerContentService } from '../database/prayer-content'
import { sendPrayerReminderEmail } from '../utils/prayer-reminder-email'

/**
 * Nitro plugin to schedule prayer reminder emails
 *
 * This plugin runs when the server starts and checks every 5 minutes
 * for users whose next_reminder_utc has passed.
 */
export default defineNitroPlugin((nitroApp) => {
  if (process.env.VITEST) return

  // Check if reminders are enabled (defaults to true)
  const enableReminders = process.env.ENABLE_REMINDER_EMAILS !== 'false'

  if (!enableReminders) {
    console.log('⏸️  Prayer reminder emails disabled')
    console.log('   Set ENABLE_REMINDER_EMAILS=true to enable')
    return
  }

  console.log('📧 Scheduling prayer reminder emails (checking every 1 minutes)')

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
  }, 60 * 1000) // 1 minute

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
  const todayDate = new Date().toISOString().split('T')[0]!

  // Get all subscriptions that are due for a reminder (with verified email)
  const dueSubscriptions = await peopleGroupSubscriptionService.getSubscriptionsDueForReminder()

  if (dueSubscriptions.length === 0) {
    return
  }

  console.log(`📧 Processing ${dueSubscriptions.length} reminder(s)...`)

  // Group subscriptions by people_group_id for efficient content fetching
  const subscriptionsByPeopleGroup = new Map<number, typeof dueSubscriptions>()
  for (const subscription of dueSubscriptions) {
    if (!subscriptionsByPeopleGroup.has(subscription.people_group_id)) {
      subscriptionsByPeopleGroup.set(subscription.people_group_id, [])
    }
    subscriptionsByPeopleGroup.get(subscription.people_group_id)!.push(subscription)
  }

  // Process each people group's subscriptions
  for (const [peopleGroupId, subscriptions] of subscriptionsByPeopleGroup) {
    try {
      // Get people group info
      const peopleGroup = await peopleGroupService.getPeopleGroupById(peopleGroupId)
      if (!peopleGroup) {
        console.error(`People group ${peopleGroupId} not found, skipping ${subscriptions.length} subscriptions`)
        continue
      }

      // Get today's prayer content (all content for this date)
      const prayerContent = await prayerContentService.getAllPrayerContentByDate(
        peopleGroupId,
        todayDate,
        'en'
      )

      // Send reminder to each subscription
      for (const subscription of subscriptions) {
        try {
          // Check if we already sent today (double-check to prevent duplicates)
          const alreadySent = await reminderSentService.wasSent(subscription.id, todayDate)
          if (alreadySent) {
            // Update next reminder time anyway
            await peopleGroupSubscriptionService.setNextReminderAfterSend(subscription.id)
            continue
          }

          // Send the email
          const emailSent = await sendPrayerReminderEmail({
            to: subscription.email_value,
            subscriberName: subscription.subscriber_name,
            peopleGroupName: subscription.people_group_name,
            peopleGroupSlug: subscription.people_group_slug,
            trackingId: subscription.subscriber_tracking_id,
            profileId: subscription.subscriber_profile_id,
            subscriptionId: subscription.id,
            prayerDuration: subscription.prayer_duration,
            prayerContent: prayerContent.length > 0 ? prayerContent : null,
            locale: subscription.subscriber_language || 'en'
          })

          if (emailSent) {
            // Record that we sent this reminder
            await reminderSentService.recordSent(subscription.id, todayDate)
            // Update next reminder time
            await peopleGroupSubscriptionService.setNextReminderAfterSend(subscription.id)
            console.log(`  ✅ Sent reminder to ${subscription.email_value} for ${subscription.people_group_name}`)
          } else {
            console.error(`  ❌ Failed to send reminder to ${subscription.email_value}`)
          }
        } catch (error: any) {
          console.error(`  ❌ Error processing subscription ${subscription.id}:`, error.message)
        }
      }
    } catch (error: any) {
      console.error(`❌ Error processing people group ${peopleGroupId}:`, error.message)
    }
  }

  console.log(`📧 Reminder processing complete`)
}
