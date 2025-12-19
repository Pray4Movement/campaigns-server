import { campaignSubscriptionService } from '#server/database/campaign-subscriptions'
import { subscriberService } from '#server/database/subscribers'
import { contactMethodService } from '#server/database/contact-methods'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const subscriptionId = getRouterParam(event, 'id')

  if (!subscriptionId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Subscription ID is required'
    })
  }

  try {
    // Get the subscription
    const subscription = await campaignSubscriptionService.getById(parseInt(subscriptionId))

    if (!subscription) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Subscription not found'
      })
    }

    // Get subscriber info
    const subscriber = await subscriberService.getSubscriberById(subscription.subscriber_id)

    if (!subscriber) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Subscriber not found'
      })
    }

    // Get contact methods
    const contacts = await contactMethodService.getSubscriberContactMethods(subscriber.id)
    const emailContact = contacts.find(c => c.type === 'email')
    const phoneContact = contacts.find(c => c.type === 'phone')

    // Get all subscriptions for this subscriber
    const allSubscriptions = await campaignSubscriptionService.getSubscriberSubscriptions(subscriber.id)

    return {
      subscriber: {
        // Subscription info (id for backwards compat)
        id: subscription.id,
        subscription_id: subscription.id,
        campaign_id: subscription.campaign_id,
        subscriber_id: subscriber.id,
        // Global subscriber info
        name: subscriber.name,
        tracking_id: subscriber.tracking_id,
        // Contact info
        email: emailContact?.value || '',
        email_verified: emailContact?.verified || false,
        phone: phoneContact?.value || '',
        // Subscription settings
        delivery_method: subscription.delivery_method,
        frequency: subscription.frequency,
        days_of_week: subscription.days_of_week,
        time_preference: subscription.time_preference,
        timezone: subscription.timezone,
        prayer_duration: subscription.prayer_duration,
        status: subscription.status,
        created_at: subscription.created_at,
        updated_at: subscription.updated_at,
        // All subscriptions for this subscriber
        all_subscriptions: allSubscriptions.map(sub => ({
          id: sub.id,
          campaign_id: sub.campaign_id,
          campaign_title: sub.campaign_title,
          campaign_slug: sub.campaign_slug,
          status: sub.status
        }))
      }
    }
  } catch (error: any) {
    if (error.statusCode) throw error

    console.error('Error fetching subscriber:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch subscriber'
    })
  }
})
