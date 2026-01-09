import { campaignService } from '#server/database/campaigns'
import { subscriberService } from '#server/database/subscribers'
import { contactMethodService } from '#server/database/contact-methods'
import { campaignSubscriptionService } from '#server/database/campaign-subscriptions'
import { sendSignupVerificationEmail } from '#server/utils/signup-verification-email'
import { sendWelcomeEmail } from '#server/utils/welcome-email'
import { isValidTimezone } from '#server/utils/next-reminder-calculator'
import { sql } from '#imports'
import { getClientIp } from '#server/utils/app/get-client-ip'

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

  // Rate limit: 5 signup attempts per email per 24 hours
  if (body.email) {
    const recentAttempts = await sql`
      SELECT COUNT(*) as count
      FROM activity_logs
      WHERE event_type = 'SIGNUP_ATTEMPT'
        AND metadata->>'email' = ${body.email.toLowerCase()}
        AND timestamp > NOW() - INTERVAL '24 hours'
    `

    if (Number(recentAttempts[0].count) >= 5) {
      throw createError({
        statusCode: 429,
        statusMessage: 'Too many signup attempts for this email. Please try again later.'
      })
    }

    // Log this attempt
    await sql`
      INSERT INTO activity_logs (event_type, identifier, metadata, timestamp)
      VALUES (
        'SIGNUP_ATTEMPT',
        ${body.email.toLowerCase()},
        ${JSON.stringify({ email: body.email.toLowerCase(), ip: getClientIp(event) })},
        NOW()
      )
    `
  }

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

    // Handle consent preferences (stored on the contact method)
    if (body.consent_campaign_updates || body.consent_doxa_general) {
      // Get the contact method for the delivery channel
      let contactMethod = null
      if (body.email) {
        contactMethod = await contactMethodService.getByValue('email', body.email)
      } else if (body.phone) {
        contactMethod = await contactMethodService.getByValue('phone', body.phone)
      }

      if (contactMethod) {
        if (body.consent_campaign_updates) {
          await contactMethodService.addCampaignConsent(contactMethod.id, campaign.id)
        }
        if (body.consent_doxa_general) {
          await contactMethodService.updateDoxaConsent(contactMethod.id, true)
        }
      }
    }

    // Get all existing subscriptions for this subscriber/campaign
    const existingSubscriptions = await campaignSubscriptionService.getAllBySubscriberAndCampaign(
      subscriber.id,
      campaign.id
    )

    const MAX_SUBSCRIPTIONS_PER_CAMPAIGN = 5

    // Check subscription limit
    const activeCount = existingSubscriptions.filter(s => s.status === 'active').length
    if (activeCount >= MAX_SUBSCRIPTIONS_PER_CAMPAIGN) {
      // At limit - send welcome email to prevent email enumeration
      if (body.delivery_method === 'email' && body.email) {
        await sendWelcomeEmail(
          body.email,
          body.name,
          campaign.title,
          slug,
          subscriber.profile_id
        )
      }
      // Return same response as new signup for privacy
      return {
        success: true,
        message: 'Please check your email to complete your signup'
      }
    }

    // Check for duplicate (same frequency + time_preference)
    const duplicate = existingSubscriptions.find(
      s => s.status === 'active' &&
           s.frequency === body.frequency &&
           s.time_preference === body.reminder_time
    )

    if (duplicate) {
      // Duplicate schedule - send welcome email to prevent email enumeration
      if (body.delivery_method === 'email' && body.email) {
        await sendWelcomeEmail(
          body.email,
          body.name,
          campaign.title,
          slug,
          subscriber.profile_id
        )
      }
      // Return same response as new signup for privacy
      return {
        success: true,
        message: 'Please check your email to complete your signup'
      }
    }

    // Check if there's an unsubscribed subscription with the same schedule to reactivate
    const unsubscribedMatch = existingSubscriptions.find(
      s => s.status === 'unsubscribed' &&
           s.frequency === body.frequency &&
           s.time_preference === body.reminder_time
    )

    if (unsubscribedMatch) {
      // Reactivate the matching unsubscribed subscription
      await campaignSubscriptionService.updateSubscription(unsubscribedMatch.id, {
        delivery_method: body.delivery_method,
        days_of_week: body.days_of_week,
        timezone,
        prayer_duration: body.prayer_duration
      })
      await campaignSubscriptionService.resubscribe(unsubscribedMatch.id)

      // For email delivery, send appropriate email
      if (body.delivery_method === 'email') {
        const emailContact = await contactMethodService.getByValue('email', body.email)
        if (emailContact && !emailContact.verified) {
          const token = await contactMethodService.generateVerificationToken(emailContact.id)
          await sendSignupVerificationEmail(body.email, token, slug, campaign.title, body.name)
        } else if (emailContact?.verified) {
          await sendWelcomeEmail(body.email, body.name, campaign.title, slug, subscriber.profile_id)
        }
      }

      // Return same response for privacy
      return {
        success: true,
        message: 'Please check your email to complete your signup'
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

    // For email delivery, handle verification
    if (body.delivery_method === 'email') {
      const emailContact = await contactMethodService.getByValue('email', body.email)

      if (emailContact?.verified) {
        // Email already verified - set next reminder and send welcome
        await campaignSubscriptionService.setInitialNextReminder(subscription.id)
        await sendWelcomeEmail(body.email, body.name, campaign.title, slug, subscriber.profile_id)
      } else if (emailContact) {
        // Email not verified - send verification email
        const token = await contactMethodService.generateVerificationToken(emailContact.id)
        await sendSignupVerificationEmail(body.email, token, slug, campaign.title, body.name)
      }

      // Always return same response for email signups
      return {
        success: true,
        message: 'Please check your email to complete your signup'
      }
    }

    // For non-email delivery (WhatsApp, app), return success
    return {
      success: true,
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
