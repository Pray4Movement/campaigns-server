import type { Job, MarketingEmailPayload } from '../../database/job-queue'
import type { ProcessorResult } from './index'
import { marketingEmailService } from '../../database/marketing-emails'
import { subscriberService } from '../../database/subscribers'
import { renderMarketingEmailHtml, tiptapToText } from '../../utils/marketing-email-template'
import { localePath } from '../../utils/translations'

const emailCache = new Map<number, { email: any; text: string }>()

export async function processMarketingEmail(job: Job): Promise<ProcessorResult> {
  const payload = job.payload as MarketingEmailPayload
  const config = useRuntimeConfig()
  const baseUrl = config.public.siteUrl || 'http://localhost:3000'

  let cached = emailCache.get(payload.marketing_email_id)
  if (!cached) {
    const email = await marketingEmailService.getByIdWithCampaign(payload.marketing_email_id)
    if (!email) {
      return { success: false, data: { error: 'Parent email not found' } }
    }

    if (email.status === 'queued') {
      await marketingEmailService.updateStatus(email.id, 'sending')
    }

    cached = { email, text: tiptapToText(email.content_json) }
    emailCache.set(payload.marketing_email_id, cached)

    setTimeout(() => emailCache.delete(payload.marketing_email_id), 5 * 60 * 1000)
  }

  const subscriber = await subscriberService.getSubscriberByContactMethodId(payload.contact_method_id)
  const profileId = subscriber?.profile_id || 'unknown'
  const subscriberLanguage = subscriber?.preferred_language || 'en'

  let unsubscribeUrl: string
  if (cached.email.audience_type === 'campaign' && cached.email.campaign_slug) {
    unsubscribeUrl = `${baseUrl}${localePath('/unsubscribe', subscriberLanguage)}?id=${profileId}&type=campaign&slug=${cached.email.campaign_slug}`
  } else {
    unsubscribeUrl = `${baseUrl}${localePath('/unsubscribe', subscriberLanguage)}?id=${profileId}&type=doxa`
  }

  const html = renderMarketingEmailHtml(
    cached.email.content_json,
    cached.email.audience_type === 'campaign' ? cached.email.campaign_title : undefined,
    unsubscribeUrl,
    subscriberLanguage
  )

  const sent = await sendEmail({
    to: payload.recipient_email,
    subject: cached.email.subject,
    html,
    text: cached.text
  })

  if (sent) {
    await marketingEmailService.incrementSentCount(payload.marketing_email_id)
    console.log(`  Sent marketing email to ${payload.recipient_email}`)
    return { success: true }
  } else {
    await marketingEmailService.incrementFailedCount(payload.marketing_email_id)
    throw new Error('Email send failed')
  }
}
