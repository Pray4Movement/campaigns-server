import { campaignService } from '#server/database/campaigns'
import { campaignSubscriptionService } from '#server/database/campaign-subscriptions'
import { contactMethodService } from '#server/database/contact-methods'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const campaignId = getRouterParam(event, 'campaignId')

  if (!campaignId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Campaign ID is required'
    })
  }

  // Check if user has access to this campaign
  const hasAccess = await campaignService.userCanAccessCampaign(user.userId, parseInt(campaignId))
  if (!hasAccess) {
    throw createError({
      statusCode: 403,
      statusMessage: 'You do not have access to this campaign'
    })
  }

  try {
    // Get all subscriptions for this campaign with subscriber details
    const subscriptions = await campaignSubscriptionService.getCampaignSubscriptions(parseInt(campaignId))

    // Enrich with contact info
    const subscribersWithContacts = await Promise.all(
      subscriptions.map(async (sub) => {
        const contacts = await contactMethodService.getSubscriberContactMethods(sub.subscriber_id)
        const emailContact = contacts.find(c => c.type === 'email')
        const phoneContact = contacts.find(c => c.type === 'phone')

        return {
          // Subscription info (using id for backwards compat with admin UI)
          id: sub.id,
          subscription_id: sub.id,
          campaign_id: sub.campaign_id,
          subscriber_id: sub.subscriber_id,
          // Subscriber info
          name: sub.subscriber_name,
          tracking_id: sub.subscriber_tracking_id,
          // Contact info
          email: emailContact?.value || '',
          email_verified: emailContact?.verified || false,
          phone: phoneContact?.value || '',
          // Subscription settings
          delivery_method: sub.delivery_method,
          frequency: sub.frequency,
          days_of_week: sub.days_of_week,
          time_preference: sub.time_preference,
          timezone: sub.timezone,
          prayer_duration: sub.prayer_duration,
          status: sub.status,
          created_at: sub.created_at,
          updated_at: sub.updated_at
        }
      })
    )

    return {
      subscribers: subscribersWithContacts
    }
  } catch (error) {
    console.error('Error fetching subscribers:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch subscribers'
    })
  }
})
