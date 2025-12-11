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

  // Group subscriptions by campaign
  const subscriptionsByCampaign = new Map<number, typeof allSubscriptions>()
  for (const sub of allSubscriptions) {
    if (!subscriptionsByCampaign.has(sub.campaign_id)) {
      subscriptionsByCampaign.set(sub.campaign_id, [])
    }
    subscriptionsByCampaign.get(sub.campaign_id)!.push(sub)
  }

  // Build campaigns array with reminders
  const campaigns = Array.from(subscriptionsByCampaign.entries()).map(([campaignId, subs]) => ({
    id: campaignId,
    title: subs[0].campaign_title,
    slug: subs[0].campaign_slug,
    reminders: subs.map(sub => ({
      id: sub.id,
      delivery_method: sub.delivery_method,
      frequency: sub.frequency,
      days_of_week: sub.days_of_week ? JSON.parse(sub.days_of_week) : [],
      time_preference: sub.time_preference,
      timezone: sub.timezone,
      prayer_duration: sub.prayer_duration,
      status: sub.status
    }))
  }))

  // Find current campaign's reminders
  const currentCampaignReminders = campaigns.find(c => c.id === campaign.id)?.reminders || []

  // Return subscriber info + all subscriptions grouped by campaign
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
    // Current campaign's reminders (for backwards compatibility and convenience)
    currentReminders: currentCampaignReminders,
    // All campaigns with their reminders (grouped)
    campaigns
  }
})
