import { campaignService } from '#server/database/campaigns'
import { subscriberService } from '#server/database/subscribers'
import { campaignSubscriptionService } from '#server/database/campaign-subscriptions'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const query = getQuery(event)
  const trackingId = query.id as string
  const subscriptionId = query.sid ? Number(query.sid) : null

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

  // Get all subscriptions for this subscriber/campaign
  const allSubscriptions = await campaignSubscriptionService.getAllBySubscriberAndCampaign(
    subscriber.id,
    campaign.id
  )

  if (allSubscriptions.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'You are not subscribed to this campaign'
    })
  }

  // Find the specific subscription to unsubscribe
  let subscriptionToUnsubscribe = subscriptionId
    ? allSubscriptions.find(s => s.id === subscriptionId)
    : allSubscriptions.find(s => s.status === 'active') // Fallback to first active if no sid

  if (!subscriptionToUnsubscribe) {
    // All subscriptions might be already unsubscribed
    const otherReminders = allSubscriptions
      .filter(s => s.status === 'active')
      .map(s => ({
        id: s.id,
        frequency: s.frequency,
        days_of_week: s.days_of_week ? JSON.parse(s.days_of_week) : [],
        time_preference: s.time_preference,
        timezone: s.timezone
      }))

    return {
      success: true,
      message: 'You have already been unsubscribed',
      already_unsubscribed: true,
      campaign_title: campaign.title,
      campaign_slug: slug,
      unsubscribed_reminder: null,
      other_reminders: otherReminders
    }
  }

  // Check if this specific subscription is already unsubscribed
  if (subscriptionToUnsubscribe.status === 'unsubscribed') {
    const otherReminders = allSubscriptions
      .filter(s => s.id !== subscriptionToUnsubscribe!.id && s.status === 'active')
      .map(s => ({
        id: s.id,
        frequency: s.frequency,
        days_of_week: s.days_of_week ? JSON.parse(s.days_of_week) : [],
        time_preference: s.time_preference,
        timezone: s.timezone
      }))

    return {
      success: true,
      message: 'You have already been unsubscribed from this reminder',
      already_unsubscribed: true,
      campaign_title: campaign.title,
      campaign_slug: slug,
      unsubscribed_reminder: {
        id: subscriptionToUnsubscribe.id,
        frequency: subscriptionToUnsubscribe.frequency,
        days_of_week: subscriptionToUnsubscribe.days_of_week ? JSON.parse(subscriptionToUnsubscribe.days_of_week) : [],
        time_preference: subscriptionToUnsubscribe.time_preference,
        timezone: subscriptionToUnsubscribe.timezone
      },
      other_reminders: otherReminders
    }
  }

  // Unsubscribe from this specific reminder
  const result = await campaignSubscriptionService.unsubscribe(subscriptionToUnsubscribe.id)

  if (!result) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to unsubscribe'
    })
  }

  // Get remaining active reminders
  const otherReminders = allSubscriptions
    .filter(s => s.id !== subscriptionToUnsubscribe!.id && s.status === 'active')
    .map(s => ({
      id: s.id,
      frequency: s.frequency,
      days_of_week: s.days_of_week ? JSON.parse(s.days_of_week) : [],
      time_preference: s.time_preference,
      timezone: s.timezone
    }))

  return {
    success: true,
    message: 'Successfully unsubscribed from this reminder',
    already_unsubscribed: false,
    campaign_title: campaign.title,
    campaign_slug: slug,
    unsubscribed_reminder: {
      id: subscriptionToUnsubscribe.id,
      frequency: subscriptionToUnsubscribe.frequency,
      days_of_week: subscriptionToUnsubscribe.days_of_week ? JSON.parse(subscriptionToUnsubscribe.days_of_week) : [],
      time_preference: subscriptionToUnsubscribe.time_preference,
      timezone: subscriptionToUnsubscribe.timezone
    },
    other_reminders: otherReminders
  }
})
