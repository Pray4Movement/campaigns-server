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
    // Get subscription data before deletion for logging
    const subscription = await campaignSubscriptionService.getById(parseInt(subscriptionId))

    if (!subscription) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Subscription not found'
      })
    }

    // Get subscriber info
    const subscriber = await subscriberService.getSubscriberById(subscription.subscriber_id)
    const contacts = subscriber ? await contactMethodService.getSubscriberContactMethods(subscriber.id) : []
    const emailContact = contacts.find(c => c.type === 'email')
    const phoneContact = contacts.find(c => c.type === 'phone')

    // Delete the subscription
    await campaignSubscriptionService.deleteSubscription(subscription.id)

    // Log the deletion with details
    logDelete('campaign_subscriptions', subscriptionId, event, {
      deletedRecord: {
        name: subscriber?.name,
        email: emailContact?.value,
        phone: phoneContact?.value,
        delivery_method: subscription.delivery_method,
        status: subscription.status,
        campaign_id: subscription.campaign_id
      }
    })

    // Note: We don't delete the subscriber here because they might have other subscriptions
    // The subscriber will remain even if all subscriptions are deleted

    return {
      success: true
    }
  } catch (error: any) {
    if (error.statusCode) throw error

    console.error('Error deleting subscription:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete subscription'
    })
  }
})
