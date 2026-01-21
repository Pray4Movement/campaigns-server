import { campaignSubscriptionService } from '#server/database/campaign-subscriptions'
import { followupTrackingService } from '#server/database/followup-tracking'
import { subscriberService } from '#server/database/subscribers'
import { campaignService } from '#server/database/campaigns'

export default defineEventHandler(async (event) => {
  const subscriptionId = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!subscriptionId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Subscription ID is required'
    })
  }

  const { response } = body

  const validResponses = ['committed', 'sometimes', 'not_praying']
  if (!response || !validResponses.includes(response)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid response. Must be one of: committed, sometimes, not_praying'
    })
  }

  // Get the subscription
  const subscription = await campaignSubscriptionService.getSubscriptionWithFollowupDetails(
    parseInt(subscriptionId)
  )

  if (!subscription) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Subscription not found'
    })
  }

  // Get subscriber for profile_id
  const subscriber = await subscriberService.getSubscriberById(subscription.subscriber_id)
  if (!subscriber) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Subscriber not found'
    })
  }

  // Get campaign for slug
  const campaign = await campaignService.getCampaignById(subscription.campaign_id)
  if (!campaign) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Campaign not found'
    })
  }

  // Record the response
  const followupSentAt = subscription.last_followup_at
    ? new Date(subscription.last_followup_at)
    : new Date()

  await followupTrackingService.recordResponse(
    subscription.id,
    response as 'committed' | 'sometimes' | 'not_praying',
    followupSentAt
  )

  // Handle response based on type
  if (response === 'committed' || response === 'sometimes') {
    // Complete the follow-up cycle - increment followup_count, reset followup_reminder_count
    await campaignSubscriptionService.completeFollowupCycle(subscription.id)
  } else if (response === 'not_praying') {
    // Mark subscription as inactive
    await campaignSubscriptionService.updateStatus(subscription.id, 'inactive')
  }

  // Return success with profile_id and campaign_slug for the landing page
  return {
    success: true,
    message: getResponseMessage(response),
    profile_id: subscriber.profile_id,
    campaign_slug: campaign.slug
  }
})

function getResponseMessage(response: string): string {
  switch (response) {
    case 'committed':
      return 'Thank you for your commitment to prayer!'
    case 'sometimes':
      return 'Thank you for your honesty. Consider adjusting your schedule if needed.'
    case 'not_praying':
      return 'Your subscription has been paused. You can reactivate it anytime.'
    default:
      return 'Response recorded.'
  }
}
