import { reminderSentService } from '#server/database/reminder-sent'
import { reminderSignupService } from '#server/database/reminder-signups'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Subscriber ID is required'
    })
  }

  const subscriberId = parseInt(id)

  // Verify subscriber exists
  const subscriber = await reminderSignupService.getSignupById(subscriberId)
  if (!subscriber) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Subscriber not found'
    })
  }

  // Get email history
  const history = await reminderSentService.getSentHistory(subscriberId, 50)

  return {
    history
  }
})
