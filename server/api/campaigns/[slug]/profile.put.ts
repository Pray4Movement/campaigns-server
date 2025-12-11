import { campaignService } from '#server/database/campaigns'
import { reminderSignupService } from '#server/database/reminder-signups'
import { sendSignupVerificationEmail } from '#server/utils/signup-verification-email'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const body = await readBody(event)
  const trackingId = body.tracking_id as string

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

  // Get the signup (need full record for change tracking)
  const signup = await reminderSignupService.getSignupByTrackingId(trackingId)
  const originalSignup = signup ? { ...signup } : null

  if (!signup) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Subscription not found'
    })
  }

  // Verify signup belongs to this campaign
  if (signup.campaign_id !== campaign.id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid link for this campaign'
    })
  }

  // Validate required fields
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

  // Build updates object
  const updates: {
    name?: string
    email?: string
    frequency?: string
    days_of_week?: number[]
    time_preference?: string
    timezone?: string
    prayer_duration?: number
  } = {}

  if (body.name !== undefined) updates.name = body.name.trim()
  if (body.email !== undefined) updates.email = body.email.trim().toLowerCase()
  if (body.frequency !== undefined) updates.frequency = body.frequency
  if (body.days_of_week !== undefined) updates.days_of_week = body.days_of_week
  if (body.time_preference !== undefined) updates.time_preference = body.time_preference
  if (body.timezone !== undefined) updates.timezone = body.timezone
  if (body.prayer_duration !== undefined) updates.prayer_duration = body.prayer_duration

  // Update the subscriber
  const { signup: updatedSignup, emailChanged } = await reminderSignupService.updateSubscriberPreferences(
    signup.id,
    updates
  )

  if (!updatedSignup) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update preferences'
    })
  }

  // If email changed, send verification email to new address
  if (emailChanged && updates.email) {
    const verificationToken = await reminderSignupService.generateVerificationToken(signup.id)
    await sendSignupVerificationEmail(
      updates.email,
      verificationToken,
      slug,
      campaign.title,
      updatedSignup.name
    )
  }

  // Log activity for profile changes
  if (originalSignup) {
    const changes: Record<string, { from: any; to: any }> = {}

    if (updates.name !== undefined && updates.name !== originalSignup.name) {
      changes.name = { from: originalSignup.name, to: updates.name }
    }
    if (updates.email !== undefined && updates.email !== originalSignup.email) {
      changes.email = { from: originalSignup.email, to: updates.email }
    }
    if (updates.frequency !== undefined && updates.frequency !== originalSignup.frequency) {
      changes.frequency = { from: originalSignup.frequency, to: updates.frequency }
    }
    if (updates.time_preference !== undefined && updates.time_preference !== originalSignup.time_preference) {
      changes.time_preference = { from: originalSignup.time_preference, to: updates.time_preference }
    }
    if (updates.timezone !== undefined && updates.timezone !== originalSignup.timezone) {
      changes.timezone = { from: originalSignup.timezone, to: updates.timezone }
    }
    if (updates.prayer_duration !== undefined && updates.prayer_duration !== originalSignup.prayer_duration) {
      changes.prayer_duration = { from: originalSignup.prayer_duration, to: updates.prayer_duration }
    }
    if (updates.days_of_week !== undefined) {
      const oldDays = originalSignup.days_of_week ? JSON.parse(originalSignup.days_of_week) : []
      const newDays = updates.days_of_week
      if (JSON.stringify(oldDays) !== JSON.stringify(newDays)) {
        changes.days_of_week = { from: oldDays, to: newDays }
      }
    }

    if (Object.keys(changes).length > 0) {
      logUpdate('reminder_signups', String(signup.id), undefined, {
        changes,
        source: 'self_service',
        subscriberName: updatedSignup.name
      })
    }
  }

  return {
    success: true,
    email_changed: emailChanged,
    subscriber: {
      name: updatedSignup.name,
      email: updatedSignup.email,
      frequency: updatedSignup.frequency,
      days_of_week: updatedSignup.days_of_week ? JSON.parse(updatedSignup.days_of_week) : [],
      time_preference: updatedSignup.time_preference,
      timezone: updatedSignup.timezone,
      prayer_duration: updatedSignup.prayer_duration,
      status: updatedSignup.status,
      email_verified: updatedSignup.email_verified
    }
  }
})
