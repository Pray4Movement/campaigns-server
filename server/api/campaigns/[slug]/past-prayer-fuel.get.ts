import { campaignService } from '#server/database/campaigns'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const query = getQuery(event)

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

  // Only return content for active campaigns
  if (campaign.status !== 'active') {
    throw createError({
      statusCode: 404,
      statusMessage: 'Campaign not found'
    })
  }

  // Get language preference (default to campaign's default language)
  const languageCode = (query.language as string) || campaign.default_language || 'en'

  // Generate past 7 days (yesterday through 7 days ago)
  const pastContent: Array<{ id: string; content_date: string }> = []
  const today = new Date()
  for (let i = 1; i <= 7; i++) {
    const pastDate = new Date(today)
    pastDate.setDate(today.getDate() - i)
    const dateStr = pastDate.toISOString().split('T')[0]!
    pastContent.push({
      id: `${dateStr}-${campaign.id}`,
      content_date: dateStr
    })
  }

  return {
    campaign: {
      id: campaign.id,
      slug: campaign.slug,
      title: campaign.title,
      default_language: campaign.default_language
    },
    language: languageCode,
    content: pastContent
  }
})
