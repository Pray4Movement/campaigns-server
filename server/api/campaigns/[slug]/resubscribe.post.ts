import { campaignService } from '#server/database/campaigns'
import { subscriberService } from '#server/database/subscribers'
import { campaignSubscriptionService } from '#server/database/campaign-subscriptions'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const body = await readBody(event)
  const trackingId = body.tracking_id as string

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Campaign slug is required'
    })
  }

  if (!trackingId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Tracking ID is required'
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

  // Get the subscriber by tracking ID
  const subscriber = await subscriberService.getSubscriberByTrackingId(trackingId)

  if (!subscriber) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Subscription not found'
    })
  }

  // Get the subscription for this campaign
  const subscription = await campaignSubscriptionService.getBySubscriberAndCampaign(
    subscriber.id,
    campaign.id
  )

  if (!subscription) {
    throw createError({
      statusCode: 404,
      statusMessage: 'You are not subscribed to this campaign'
    })
  }

  // Check if already active
  if (subscription.status === 'active') {
    return {
      success: true,
      message: 'Subscription is already active',
      already_active: true,
      campaign_title: campaign.title,
      campaign_slug: slug
    }
  }

  // Reactivate the subscription
  const result = await campaignSubscriptionService.resubscribe(subscription.id)

  if (!result) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to resubscribe'
    })
  }

  return {
    success: true,
    message: 'Successfully resubscribed to prayer reminders',
    already_active: false,
    campaign_title: campaign.title,
    campaign_slug: slug
  }
})
