/**
 * POST /api/campaigns/:slug/resubscribe
 * Re-subscribe to campaign reminders after unsubscribing
 */
import { peopleGroupService } from '#server/database/people-groups'
import { subscriberService } from '#server/database/subscribers'
import { campaignSubscriptionService } from '#server/database/campaign-subscriptions'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const body = await readBody(event)
  const profileId = body.profile_id as string

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Campaign slug is required'
    })
  }

  if (!profileId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Profile ID is required'
    })
  }

  // Verify the people group exists
  const peopleGroup = await peopleGroupService.getPeopleGroupBySlug(slug)

  if (!peopleGroup) {
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
      statusMessage: 'Subscription not found'
    })
  }

  // Get the subscription - by ID if provided, otherwise find first unsubscribed
  const subscriptionId = body.subscription_id as number | undefined
  let subscription

  if (subscriptionId) {
    subscription = await campaignSubscriptionService.getById(subscriptionId)
    if (!subscription || subscription.subscriber_id !== subscriber.id || subscription.people_group_id !== peopleGroup.id) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Subscription not found'
      })
    }
  } else {
    // Legacy behavior: find first subscription for this campaign
    subscription = await campaignSubscriptionService.getBySubscriberAndCampaign(
      subscriber.id,
      peopleGroup.id
    )
    if (!subscription) {
      throw createError({
        statusCode: 404,
        statusMessage: 'You are not subscribed to this campaign'
      })
    }
  }

  // Check if already active
  if (subscription.status === 'active') {
    return {
      message: 'Subscription is already active',
      already_active: true,
      campaign_title: peopleGroup.name,
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
    message: 'Successfully resubscribed to prayer reminders',
    already_active: false,
    campaign_title: peopleGroup.name,
    campaign_slug: slug
  }
})
