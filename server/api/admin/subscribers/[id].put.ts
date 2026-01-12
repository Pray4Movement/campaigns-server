import { campaignSubscriptionService } from '#server/database/campaign-subscriptions'
import { subscriberService } from '#server/database/subscribers'
import { contactMethodService } from '#server/database/contact-methods'
import { campaignService } from '#server/database/campaigns'
import { handleApiError } from '#server/utils/api-helpers'

export default defineEventHandler(async (event) => {
  const user = await requirePermission(event, 'campaigns.edit')

  const subscriptionId = getRouterParam(event, 'id')

  if (!subscriptionId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Subscription ID is required'
    })
  }

  const body = await readBody(event)
  const { name, email, phone, frequency, time_preference, timezone, prayer_duration, status } = body

  if (!name) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Name is required'
    })
  }

  try {
    // Get current subscription
    const subscription = await campaignSubscriptionService.getById(parseInt(subscriptionId))

    if (!subscription) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Subscription not found'
      })
    }

    // Verify user has access to this campaign
    const hasAccess = await campaignService.userCanAccessCampaign(user.userId, subscription.campaign_id)
    if (!hasAccess) {
      throw createError({
        statusCode: 403,
        statusMessage: 'You do not have access to this subscription'
      })
    }

    // Get subscriber
    const subscriber = await subscriberService.getSubscriberById(subscription.subscriber_id)

    if (!subscriber) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Subscriber not found'
      })
    }

    // Get current contacts
    const contacts = await contactMethodService.getSubscriberContactMethods(subscriber.id)
    const currentEmail = contacts.find(c => c.type === 'email')
    const currentPhone = contacts.find(c => c.type === 'phone')

    // Track changes for logging
    const changes: Record<string, { from: any; to: any }> = {}

    // Update subscriber name if changed
    if (name !== subscriber.name) {
      changes.name = { from: subscriber.name, to: name }
      await subscriberService.updateSubscriber(subscriber.id, { name })
    }

    // Update email if changed
    if (email !== undefined) {
      const newEmail = email?.trim()?.toLowerCase() || ''
      const oldEmail = currentEmail?.value?.toLowerCase() || ''

      if (newEmail !== oldEmail) {
        changes.email = { from: oldEmail, to: newEmail }

        if (newEmail && currentEmail) {
          // Update existing email (resets verification)
          await contactMethodService.updateContactMethod(currentEmail.id, { value: newEmail })
        } else if (newEmail && !currentEmail) {
          // Add new email
          await contactMethodService.addContactMethod(subscriber.id, 'email', newEmail)
        } else if (!newEmail && currentEmail) {
          // Remove email
          await contactMethodService.removeContactMethod(currentEmail.id)
        }
      }
    }

    // Update phone if changed
    if (phone !== undefined) {
      const newPhone = phone?.trim() || ''
      const oldPhone = currentPhone?.value || ''

      if (newPhone !== oldPhone) {
        changes.phone = { from: oldPhone, to: newPhone }

        if (newPhone && currentPhone) {
          await contactMethodService.updateContactMethod(currentPhone.id, { value: newPhone })
        } else if (newPhone && !currentPhone) {
          await contactMethodService.addContactMethod(subscriber.id, 'phone', newPhone)
        } else if (!newPhone && currentPhone) {
          await contactMethodService.removeContactMethod(currentPhone.id)
        }
      }
    }

    // Update subscription settings
    const subscriptionUpdates: Record<string, any> = {}

    if (frequency !== undefined && frequency !== subscription.frequency) {
      changes.frequency = { from: subscription.frequency, to: frequency }
      subscriptionUpdates.frequency = frequency
    }
    if (time_preference !== undefined && time_preference !== subscription.time_preference) {
      changes.time_preference = { from: subscription.time_preference, to: time_preference }
      subscriptionUpdates.time_preference = time_preference
    }
    if (timezone !== undefined && timezone !== subscription.timezone) {
      changes.timezone = { from: subscription.timezone, to: timezone }
      subscriptionUpdates.timezone = timezone
    }
    if (prayer_duration !== undefined && prayer_duration !== subscription.prayer_duration) {
      changes.prayer_duration = { from: subscription.prayer_duration, to: prayer_duration }
      subscriptionUpdates.prayer_duration = prayer_duration
    }

    if (Object.keys(subscriptionUpdates).length > 0) {
      await campaignSubscriptionService.updateSubscription(subscription.id, subscriptionUpdates)
    }

    // Update status if changed
    if (status !== undefined && status !== subscription.status) {
      changes.status = { from: subscription.status, to: status }
      await campaignSubscriptionService.updateStatus(subscription.id, status)
    }

    // Log the update if any changes were made
    if (Object.keys(changes).length > 0) {
      logUpdate('campaign_subscriptions', subscriptionId, event, { changes })
    }

    // Get updated data
    const updatedSubscription = await campaignSubscriptionService.getById(subscription.id)
    const updatedSubscriber = await subscriberService.getSubscriberById(subscriber.id)
    const updatedContacts = await contactMethodService.getSubscriberContactMethods(subscriber.id)
    const updatedEmail = updatedContacts.find(c => c.type === 'email')
    const updatedPhone = updatedContacts.find(c => c.type === 'phone')

    return {
      subscriber: {
        id: updatedSubscription?.id,
        subscription_id: updatedSubscription?.id,
        campaign_id: updatedSubscription?.campaign_id,
        subscriber_id: updatedSubscriber?.id,
        name: updatedSubscriber?.name,
        tracking_id: updatedSubscriber?.tracking_id,
        email: updatedEmail?.value || '',
        email_verified: updatedEmail?.verified || false,
        phone: updatedPhone?.value || '',
        delivery_method: updatedSubscription?.delivery_method,
        frequency: updatedSubscription?.frequency,
        time_preference: updatedSubscription?.time_preference,
        timezone: updatedSubscription?.timezone,
        prayer_duration: updatedSubscription?.prayer_duration,
        status: updatedSubscription?.status,
        created_at: updatedSubscription?.created_at,
        updated_at: updatedSubscription?.updated_at
      }
    }
  } catch (error) {
    handleApiError(error, 'Failed to update subscriber')
  }
})
