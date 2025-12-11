import { campaignService } from '#server/database/campaigns'
import { reminderSignupService } from '#server/database/reminder-signups'

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
      statusMessage: 'Invalid link for this campaign'
    })
  }

  // Check if already active
  if (signup.status === 'active') {
    return {
      success: true,
      message: 'Subscription is already active',
      already_active: true,
      campaign_title: campaign.title,
      campaign_slug: slug
    }
  }

  // Reactivate the subscription
  const result = await reminderSignupService.resubscribe(signup.id)

  if (!result) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to resubscribe'
    })
  }

  return {
    success: true,
    message: 'Successfully resubscribed to prayer reminders',
    already_active: false,
    campaign_title: campaign.title,
    campaign_slug: slug
  }
})
