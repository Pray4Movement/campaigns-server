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

  // Get the signup to verify it belongs to this campaign
  const signup = await reminderSignupService.getSignupByTrackingId(trackingId)

  if (!signup) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Subscription not found'
    })
  }

  if (signup.campaign_id !== campaign.id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid unsubscribe link for this campaign'
    })
  }

  // Check if already unsubscribed
  if (signup.status === 'unsubscribed') {
    return {
      success: true,
      message: 'You have already been unsubscribed',
      already_unsubscribed: true,
      campaign_title: campaign.title,
      campaign_slug: slug
    }
  }

  // Unsubscribe the user
  const result = await reminderSignupService.unsubscribeByTrackingId(trackingId)

  if (!result) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to unsubscribe'
    })
  }

  return {
    success: true,
    message: 'Successfully unsubscribed from prayer reminders',
    already_unsubscribed: false,
    campaign_title: campaign.title,
    campaign_slug: slug
  }
})
