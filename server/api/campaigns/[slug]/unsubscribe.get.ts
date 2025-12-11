import { campaignService } from '#server/database/campaigns'
import { subscriberService } from '#server/database/subscribers'
import { campaignSubscriptionService } from '#server/database/campaign-subscriptions'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const query = getQuery(event)
  const trackingId = query.id as string

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

  // Check if already unsubscribed
  if (subscription.status === 'unsubscribed') {
    return {
      success: true,
      message: 'You have already been unsubscribed',
      already_unsubscribed: true,
      campaign_title: campaign.title,
      campaign_slug: slug
    }
  }

  // Unsubscribe from this campaign
  const result = await campaignSubscriptionService.unsubscribe(subscription.id)

  if (!result) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to unsubscribe'
    })
  }

  return {
    success: true,
    message: 'Successfully unsubscribed from prayer reminders',
    already_unsubscribed: false,
    campaign_title: campaign.title,
    campaign_slug: slug
  }
})
