import { campaignService } from '#server/database/campaigns'
import { subscriberService } from '#server/database/subscribers'
import { contactMethodService } from '#server/database/contact-methods'
import { campaignSubscriptionService } from '#server/database/campaign-subscriptions'
import { sendSignupVerificationEmail } from '#server/utils/signup-verification-email'
import { isValidTimezone } from '#server/utils/next-reminder-calculator'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Campaign slug is required'
    })
  }

  // Get campaign by slug
  const campaign = await campaignService.getCampaignBySlug(slug)

  if (!campaign) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Campaign not found'
    })
  }

  // Only allow signups for active campaigns
  if (campaign.status !== 'active') {
    throw createError({
      statusCode: 400,
      statusMessage: 'This campaign is not accepting signups'
    })
  }

  // Get request body
  const body = await readBody(event)

  // Validate required fields
  if (!body.name || !body.delivery_method || !body.frequency || !body.reminder_time) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields: name, delivery_method, frequency, reminder_time'
    })
  }

  // Validate delivery method
  if (!['email', 'whatsapp', 'app'].includes(body.delivery_method)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid delivery method. Must be email, whatsapp, or app'
    })
  }

  // Validate email for email delivery
  if (body.delivery_method === 'email' && !body.email) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email is required for email delivery'
    })
  }

  // Validate phone for whatsapp delivery
  if (body.delivery_method === 'whatsapp' && !body.phone) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Phone number is required for WhatsApp delivery'
    })
  }

  // Validate weekly frequency has days selected
  if (body.frequency === 'weekly' && (!body.days_of_week || body.days_of_week.length === 0)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Days of week are required for weekly frequency'
    })
  }

  // Validate and normalize timezone (default to UTC if invalid or missing)
  const timezone = body.timezone && isValidTimezone(body.timezone) ? body.timezone : 'UTC'

  try {
    // Find or create subscriber
    const { subscriber, isNew } = await subscriberService.findOrCreateSubscriber({
      email: body.email,
      phone: body.phone,
      name: body.name
    })

    // Update name if subscriber exists and provided a different name
    if (!isNew && body.name && body.name !== subscriber.name) {
      await subscriberService.updateSubscriber(subscriber.id, { name: body.name })
    }

    // Check if already subscribed to this campaign
    const existingSubscription = await campaignSubscriptionService.getBySubscriberAndCampaign(
      subscriber.id,
      campaign.id
    )

    if (existingSubscription) {
      // Already subscribed - check status
      if (existingSubscription.status === 'active') {
        return {
          success: false,
          error: 'already_subscribed',
          tracking_id: subscriber.tracking_id,
          message: 'You are already subscribed to this campaign'
        }
      } else if (existingSubscription.status === 'unsubscribed') {
        // Reactivate and update preferences
        await campaignSubscriptionService.updateSubscription(existingSubscription.id, {
          delivery_method: body.delivery_method,
          frequency: body.frequency,
          days_of_week: body.days_of_week,
          time_preference: body.reminder_time,
          timezone,
          prayer_duration: body.prayer_duration
        })
        await campaignSubscriptionService.resubscribe(existingSubscription.id)

        return {
          success: true,
          tracking_id: subscriber.tracking_id,
          resubscribed: true,
          message: 'Your subscription has been reactivated'
        }
      }
    }

    // Create new subscription
    const subscription = await campaignSubscriptionService.createSubscription({
      campaign_id: campaign.id,
      subscriber_id: subscriber.id,
      delivery_method: body.delivery_method,
      frequency: body.frequency,
      days_of_week: body.days_of_week,
      time_preference: body.reminder_time,
      timezone,
      prayer_duration: body.prayer_duration
    })

    // For email delivery, check if email needs verification
    if (body.delivery_method === 'email') {
      const emailContact = await contactMethodService.getByValue('email', body.email)

      if (emailContact && !emailContact.verified) {
        // Email exists but not verified - send verification
        const token = await contactMethodService.generateVerificationToken(emailContact.id)
        const emailSent = await sendSignupVerificationEmail(
          body.email,
          token,
          slug,
          campaign.title,
          body.name
        )

        if (!emailSent) {
          console.error('Failed to send verification email for subscriber:', subscriber.id)
        }

        return {
          success: true,
          tracking_id: subscriber.tracking_id,
          requires_verification: true,
          message: 'Please check your email to verify your subscription'
        }
      } else if (emailContact && emailContact.verified) {
        // Email already verified - set next reminder
        await campaignSubscriptionService.setInitialNextReminder(subscription.id)

        return {
          success: true,
          tracking_id: subscriber.tracking_id,
          requires_verification: false,
          message: 'Successfully signed up for prayer reminders'
        }
      }
    }

    // For non-email delivery, no verification needed
    return {
      success: true,
      tracking_id: subscriber.tracking_id,
      requires_verification: false,
      message: 'Successfully signed up for prayer reminders'
    }
  } catch (error: any) {
    console.error('Signup error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to create signup'
    })
  }
})
