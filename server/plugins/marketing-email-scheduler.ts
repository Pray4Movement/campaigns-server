import { marketingEmailService } from '../database/marketing-emails'
import { marketingEmailQueueService } from '../database/marketing-email-queue'
import { subscriberService } from '../database/subscribers'
import { renderMarketingEmailHtml, tiptapToText } from '../utils/marketing-email-template'

/**
 * Nitro plugin to process marketing email queue
 *
 * This plugin runs when the server starts and checks every 30 seconds
 * for queued marketing emails to send.
 */
export default defineNitroPlugin((nitroApp) => {
  const enableMarketing = process.env.ENABLE_MARKETING_EMAILS !== 'false'

  if (!enableMarketing) {
    console.log('Marketing email processing disabled')
    console.log('   Set ENABLE_MARKETING_EMAILS=true to enable')
    return
  }

  console.log('Marketing email processor started (checking every 30 seconds)')

  let isProcessing = false

  const interval = setInterval(async () => {
    if (isProcessing) {
      return
    }

    isProcessing = true

    try {
      await processMarketingEmailQueue()
    } catch (error: any) {
      console.error('Marketing email processor error:', error.message)
    } finally {
      isProcessing = false
    }
  }, 30 * 1000) // 30 seconds

  setTimeout(async () => {
    if (!isProcessing) {
      isProcessing = true
      try {
        await processMarketingEmailQueue()
      } catch (error: any) {
        console.error('Initial marketing email check error:', error.message)
      } finally {
        isProcessing = false
      }
    }
  }, 15000) // 15 seconds after startup

  console.log('Marketing email processor initialized')

  nitroApp.hooks.hook('close', () => {
    console.log('Stopping marketing email processor...')
    clearInterval(interval)
  })
})

async function processMarketingEmailQueue() {
  const config = useRuntimeConfig()
  const baseUrl = config.public.siteUrl || 'http://localhost:3000'
  const batchSize = 10

  const pending = await marketingEmailQueueService.getPendingItems(batchSize)

  if (pending.length === 0) {
    return
  }

  console.log(`Processing ${pending.length} marketing email(s)...`)

  const emailCache = new Map<number, { email: any; html: string; text: string }>()

  for (const item of pending) {
    try {
      await marketingEmailQueueService.markProcessing(item.id)

      let cached = emailCache.get(item.marketing_email_id)
      if (!cached) {
        const email = await marketingEmailService.getByIdWithCampaign(item.marketing_email_id)
        if (!email) {
          await marketingEmailQueueService.markFailed(item.id, 'Parent email not found')
          continue
        }

        if (email.status === 'queued') {
          await marketingEmailService.updateStatus(email.id, 'sending')
        }

        const text = tiptapToText(email.content_json)

        cached = { email, html: '', text }
        emailCache.set(item.marketing_email_id, cached)
      }

      // Generate per-recipient unsubscribe URL with audience type info
      const subscriber = await subscriberService.getSubscriberByContactMethodId(item.contact_method_id)
      const profileId = subscriber?.profile_id || 'unknown'

      let unsubscribeUrl: string
      if (cached.email.audience_type === 'campaign' && cached.email.campaign_slug) {
        unsubscribeUrl = `${baseUrl}/unsubscribe?id=${profileId}&type=campaign&slug=${cached.email.campaign_slug}`
      } else {
        unsubscribeUrl = `${baseUrl}/unsubscribe?id=${profileId}&type=doxa`
      }

      const html = renderMarketingEmailHtml(
        cached.email.content_json,
        cached.email.audience_type === 'campaign' ? cached.email.campaign_title : undefined,
        unsubscribeUrl
      )

      const sent = await sendEmail({
        to: item.recipient_email,
        subject: cached.email.subject,
        html,
        text: cached.text
      })

      if (sent) {
        await marketingEmailQueueService.markSent(item.id)
        await marketingEmailService.incrementSentCount(item.marketing_email_id)
        console.log(`  Sent marketing email to ${item.recipient_email}`)
      } else {
        await marketingEmailQueueService.markFailed(item.id, 'Send failed')
        await marketingEmailService.incrementFailedCount(item.marketing_email_id)
        console.error(`  Failed to send marketing email to ${item.recipient_email}`)
      }
    } catch (error: any) {
      await marketingEmailQueueService.markFailed(item.id, error.message || 'Unknown error')
      await marketingEmailService.incrementFailedCount(item.marketing_email_id)
      console.error(`  Error processing queue item ${item.id}:`, error.message)
    }
  }

  for (const [emailId, cached] of emailCache) {
    const isComplete = await marketingEmailQueueService.isQueueComplete(emailId)
    if (isComplete) {
      const stats = await marketingEmailQueueService.getQueueStats(emailId)
      const finalStatus = stats.failed > 0 && stats.sent === 0 ? 'failed' : 'sent'
      await marketingEmailService.updateStatus(emailId, finalStatus)
      console.log(`  Marketing email ${emailId} complete: ${stats.sent} sent, ${stats.failed} failed`)
    }
  }

  console.log('Marketing email processing complete')
}
