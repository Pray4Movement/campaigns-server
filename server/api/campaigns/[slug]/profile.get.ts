import { campaignService } from '#server/database/campaigns'
import { subscriberService } from '#server/database/subscribers'
import { contactMethodService } from '#server/database/contact-methods'
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

  // Get all contact methods for this subscriber
  const contacts = await contactMethodService.getSubscriberContactMethods(subscriber.id)
  const primaryEmail = contacts.find(c => c.type === 'email')
  const primaryPhone = contacts.find(c => c.type === 'phone')

  // Get all subscriptions for this subscriber
  const allSubscriptions = await campaignSubscriptionService.getSubscriberSubscriptions(subscriber.id)

  // Find this campaign's subscription
  const currentSubscription = allSubscriptions.find(sub => sub.campaign_id === campaign.id)

  if (!currentSubscription) {
    throw createError({
      statusCode: 404,
      statusMessage: 'You are not subscribed to this campaign'
    })
  }

  // Return subscriber info + all subscriptions
  return {
    subscriber: {
      id: subscriber.id,
      tracking_id: subscriber.tracking_id,
      name: subscriber.name,
      email: primaryEmail?.value || '',
      email_verified: primaryEmail?.verified || false,
      phone: primaryPhone?.value || ''
    },
    // Current campaign info
    campaign: {
      id: campaign.id,
      title: campaign.title,
      slug: campaign.slug
    },
    // Current campaign's subscription
    currentSubscription: {
      id: currentSubscription.id,
      delivery_method: currentSubscription.delivery_method,
      frequency: currentSubscription.frequency,
      days_of_week: currentSubscription.days_of_week ? JSON.parse(currentSubscription.days_of_week) : [],
      time_preference: currentSubscription.time_preference,
      timezone: currentSubscription.timezone,
      prayer_duration: currentSubscription.prayer_duration,
      status: currentSubscription.status
    },
    // All subscriptions for unified profile view
    subscriptions: allSubscriptions.map(sub => ({
      id: sub.id,
      campaign_id: sub.campaign_id,
      campaign_title: sub.campaign_title,
      campaign_slug: sub.campaign_slug,
      delivery_method: sub.delivery_method,
      frequency: sub.frequency,
      days_of_week: sub.days_of_week ? JSON.parse(sub.days_of_week) : [],
      time_preference: sub.time_preference,
      timezone: sub.timezone,
      prayer_duration: sub.prayer_duration,
      status: sub.status
    }))
  }
})
