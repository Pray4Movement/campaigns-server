/**
 * DELETE /api/people-groups/:slug/reminder/:id
 * Delete a specific reminder for a campaign subscription
 */
import { peopleGroupService } from '#server/database/people-groups'
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
  if (subscription.subscriber_id !== subscriber.id || subscription.people_group_id !== peopleGroup.id) {
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
    message: 'Reminder deleted successfully'
  }
})
