import { campaignService } from '#server/database/campaigns'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Campaign slug is required'
    })
  }

  const campaign = await campaignService.getCampaignBySlug(slug)

  if (!campaign) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Campaign not found'
    })
  }

  // Only return active campaigns to the public
  if (campaign.status !== 'active') {
    throw createError({
      statusCode: 404,
      statusMessage: 'Campaign not found'
    })
  }

  return {
    campaign
  }
})
