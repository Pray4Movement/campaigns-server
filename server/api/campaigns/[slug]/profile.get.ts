import { campaignService } from '#server/database/campaigns'
import { reminderSignupService } from '#server/database/reminder-signups'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const query = getQuery(event)
  const trackingId = query.id as string

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

  // Get the signup
  const signup = await reminderSignupService.getSignupByTrackingId(trackingId)

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

  // Return subscriber preferences (excluding sensitive data)
  return {
    subscriber: {
      name: signup.name,
      email: signup.email,
      frequency: signup.frequency,
      days_of_week: signup.days_of_week ? JSON.parse(signup.days_of_week) : [],
      time_preference: signup.time_preference,
      timezone: signup.timezone,
      prayer_duration: signup.prayer_duration,
      status: signup.status,
      email_verified: signup.email_verified
    },
    campaign: {
      title: campaign.title,
      slug: campaign.slug
    }
  }
})
