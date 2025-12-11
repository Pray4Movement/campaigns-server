import { campaignService } from '#server/database/campaigns'
import { reminderSignupService } from '#server/database/reminder-signups'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const query = getQuery(event)
  const token = query.token as string

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Campaign slug is required'
    })
  }

  if (!token) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Verification token is required'
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

  // Verify the token
  const result = await reminderSignupService.verifyByToken(token)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error || 'Verification failed'
    })
  }

  // Verify the signup belongs to this campaign
  if (result.signup && result.signup.campaign_id !== campaign.id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid verification link for this campaign'
    })
  }

  // Set the initial next reminder time now that email is verified
  if (result.signup) {
    await reminderSignupService.setInitialNextReminder(result.signup.id)
  }

  return {
    success: true,
    message: 'Email verified successfully',
    campaign_title: campaign.title,
    campaign_slug: slug
  }
})
