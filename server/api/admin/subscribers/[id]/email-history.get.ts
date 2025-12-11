import { reminderSentService } from '#server/database/reminder-sent'
import { campaignSubscriptionService } from '#server/database/campaign-subscriptions'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Subscription ID is required'
    })
  }

  const subscriptionId = parseInt(id)

  // Verify subscription exists
  const subscription = await campaignSubscriptionService.getById(subscriptionId)
  if (!subscription) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Subscription not found'
    })
  }

  // Get email history for this subscription
  const history = await reminderSentService.getSentHistory(subscriptionId, 50)

  return {
    history
  }
})
