import { campaignService } from '#server/database/campaigns'
import { subscriberService } from '#server/database/subscribers'
import { campaignSubscriptionService } from '#server/database/campaign-subscriptions'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const reminderId = getRouterParam(event, 'id')
  const query = getQuery(event)
  const profileId = query.id as string

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Campaign slug is required'
    })
  }

  if (!reminderId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Reminder ID is required'
    })
  }

  if (!profileId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Profile ID is required'
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

  // Get the subscriber by profile ID
  const subscriber = await subscriberService.getSubscriberByProfileId(profileId)

  if (!subscriber) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Subscriber not found'
    })
  }

  // Get the subscription to delete
  const subscription = await campaignSubscriptionService.getById(Number(reminderId))

  if (!subscription) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Reminder not found'
    })
  }

  // Verify ownership
  if (subscription.subscriber_id !== subscriber.id || subscription.campaign_id !== campaign.id) {
    throw createError({
      statusCode: 403,
      statusMessage: 'You do not have permission to delete this reminder'
    })
  }

  // Delete the subscription
  const deleted = await campaignSubscriptionService.deleteSubscription(subscription.id)

  if (!deleted) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete reminder'
    })
  }

  return {
    success: true,
    message: 'Reminder deleted successfully'
  }
})
