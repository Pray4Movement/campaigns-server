/**
 * GET /api/campaigns/:slug/verify
 * Verify email address for campaign subscription
 */
import { campaignService } from '#server/database/campaigns'
import { contactMethodService } from '#server/database/contact-methods'
import { campaignSubscriptionService } from '#server/database/campaign-subscriptions'
import { subscriberService } from '#server/database/subscribers'
import { sendWelcomeEmail } from '#server/utils/welcome-email'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const query = getQuery(event)
  const token = query.token as string

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Campaign slug is required'
    })
  }

  if (!token) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Verification token is required'
    })
  }

  // Verify the campaign exists
  const campaign = await campaignService.getCampaignBySlug(slug)

  if (!campaign) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Campaign not found'
    })
  }

  // Verify the token (now at contact method level)
  const result = await contactMethodService.verifyByToken(token)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error || 'Verification failed'
    })
  }

  // Set initial next reminder for all email subscriptions of this subscriber
  if (result.contactMethod) {
    await campaignSubscriptionService.setNextRemindersForSubscriber(result.contactMethod.subscriber_id)

    // Send welcome email (only if this was a new verification, not already verified)
    if (result.error !== 'Already verified') {
      const subscriber = await subscriberService.getSubscriberById(result.contactMethod.subscriber_id)
      if (subscriber) {
        sendWelcomeEmail(
          result.contactMethod.value,
          subscriber.name,
          campaign.title,
          slug,
          subscriber.profile_id,
          subscriber.preferred_language || 'en'
        ).catch(err => console.error('Failed to send welcome email:', err))
      }
    }
  }

  return {
    message: 'Email verified successfully',
    campaign_title: campaign.title,
    campaign_slug: slug
  }
})
