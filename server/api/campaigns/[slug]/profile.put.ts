import { campaignService } from '#server/database/campaigns'
import { subscriberService } from '#server/database/subscribers'
import { contactMethodService } from '#server/database/contact-methods'
import { campaignSubscriptionService } from '#server/database/campaign-subscriptions'
import { sendSignupVerificationEmail } from '#server/utils/signup-verification-email'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const body = await readBody(event)
  const profileId = body.profile_id as string

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Campaign slug is required'
    })
  }

  if (!profileId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Profile ID is required'
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

  // Get the subscriber
  const subscriber = await subscriberService.getSubscriberByProfileId(profileId)

  if (!subscriber) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Subscription not found'
    })
  }

  // Get subscriber's subscriptions for this campaign
  const subscriptions = await campaignSubscriptionService.getAllBySubscriberAndCampaign(
    subscriber.id,
    campaign.id
  )

  if (subscriptions.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'You are not subscribed to this campaign'
    })
  }

  // Find the specific subscription to update (by subscription_id or default to first)
  const subscriptionId = body.subscription_id as number | undefined
  const subscription = subscriptionId
    ? subscriptions.find(s => s.id === subscriptionId)
    : subscriptions[0]

  if (!subscription) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Subscription not found'
    })
  }

  // Get current email contact
  const contacts = await contactMethodService.getSubscriberContactMethods(subscriber.id)
  const currentEmail = contacts.find(c => c.type === 'email')

  // Validation
  if (body.name !== undefined && typeof body.name !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid name'
    })
  }

  if (body.email !== undefined) {
    if (typeof body.email !== 'string' || !body.email.includes('@')) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid email address'
      })
    }
  }

  if (body.frequency !== undefined && !['daily', 'weekly'].includes(body.frequency)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Frequency must be daily or weekly'
    })
  }

  if (body.frequency === 'weekly' && body.days_of_week !== undefined) {
    if (!Array.isArray(body.days_of_week) || body.days_of_week.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Please select at least one day for weekly reminders'
      })
    }
  }

  let emailChanged = false
  let newEmailContact = currentEmail

  // Handle global subscriber updates (name)
  if (body.name !== undefined && body.name.trim() !== subscriber.name) {
    await subscriberService.updateSubscriber(subscriber.id, { name: body.name.trim() })
  }

  // Handle email change (global - affects all subscriptions)
  if (body.email !== undefined) {
    const newEmail = body.email.trim().toLowerCase()
    const oldEmail = currentEmail?.value?.toLowerCase()

    if (newEmail !== oldEmail) {
      // Check if new email already exists for another subscriber
      const existingContact = await contactMethodService.getByValue('email', newEmail)
      if (existingContact && existingContact.subscriber_id !== subscriber.id) {
        throw createError({
          statusCode: 400,
          statusMessage: 'This email is already in use by another subscriber'
        })
      }

      if (currentEmail) {
        // Update existing email contact (resets verification)
        await contactMethodService.updateContactMethod(currentEmail.id, { value: newEmail })
        newEmailContact = await contactMethodService.getById(currentEmail.id)
      } else {
        // Create new email contact
        newEmailContact = await contactMethodService.addContactMethod(subscriber.id, 'email', newEmail)
      }

      emailChanged = true

      // Send verification email
      if (newEmailContact) {
        const verificationToken = await contactMethodService.generateVerificationToken(newEmailContact.id)
        await sendSignupVerificationEmail(
          newEmail,
          verificationToken,
          slug,
          campaign.title,
          body.name?.trim() || subscriber.name
        )
      }
    }
  }

  // Handle subscription-specific updates
  const subscriptionUpdates: {
    delivery_method?: 'email' | 'whatsapp' | 'app'
    frequency?: string
    days_of_week?: number[]
    time_preference?: string
    timezone?: string
    prayer_duration?: number
  } = {}

  if (body.delivery_method !== undefined) subscriptionUpdates.delivery_method = body.delivery_method
  if (body.frequency !== undefined) subscriptionUpdates.frequency = body.frequency
  if (body.days_of_week !== undefined) subscriptionUpdates.days_of_week = body.days_of_week
  if (body.time_preference !== undefined) subscriptionUpdates.time_preference = body.time_preference
  if (body.timezone !== undefined) subscriptionUpdates.timezone = body.timezone
  if (body.prayer_duration !== undefined) subscriptionUpdates.prayer_duration = body.prayer_duration

  let updatedSubscription = subscription
  if (Object.keys(subscriptionUpdates).length > 0) {
    updatedSubscription = await campaignSubscriptionService.updateSubscription(
      subscription.id,
      subscriptionUpdates
    ) || subscription
  }

  // Get updated subscriber info
  const updatedSubscriber = await subscriberService.getSubscriberById(subscriber.id)
  const updatedContacts = await contactMethodService.getSubscriberContactMethods(subscriber.id)
  const updatedEmail = updatedContacts.find(c => c.type === 'email')

  return {
    success: true,
    email_changed: emailChanged,
    subscriber: {
      id: updatedSubscriber?.id,
      profile_id: updatedSubscriber?.profile_id,
      name: updatedSubscriber?.name || subscriber.name,
      email: updatedEmail?.value || '',
      email_verified: updatedEmail?.verified || false
    },
    currentSubscription: {
      id: updatedSubscription.id,
      delivery_method: updatedSubscription.delivery_method,
      frequency: updatedSubscription.frequency,
      days_of_week: updatedSubscription.days_of_week ? JSON.parse(updatedSubscription.days_of_week) : [],
      time_preference: updatedSubscription.time_preference,
      timezone: updatedSubscription.timezone,
      prayer_duration: updatedSubscription.prayer_duration,
      status: updatedSubscription.status
    }
  }
})
