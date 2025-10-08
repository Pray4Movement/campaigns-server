import { campaignService } from '#server/database/campaigns'
import { prayerContentService } from '#server/database/prayer-content'

export default defineEventHandler((event) => {
  const slug = getRouterParam(event, 'slug')
  const query = getQuery(event)

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Campaign slug is required'
    })
  }

  // Get campaign by slug
  const campaign = campaignService.getCampaignBySlug(slug)

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

  // Get current date to exclude today and future dates
  const today = new Date().toISOString().split('T')[0]

  // Get past prayer content (limit to 30 most recent)
  const pastContent = prayerContentService.getCampaignPrayerContent(campaign.id, {
    endDate: today,
    language: languageCode,
    limit: 31 // Get 31 so we can exclude today
  })

  // Filter out today's content
  const filteredContent = pastContent.filter(item => item.content_date < today)

  // Parse content_json if needed
  const parsedContent = filteredContent.map(item => {
    let contentJson = item.content_json
    if (typeof contentJson === 'string') {
      try {
        contentJson = JSON.parse(contentJson)
      } catch (e) {
        console.error('Failed to parse content_json:', e)
      }
    }
    return {
      id: item.id,
      title: item.title,
      content_date: item.content_date,
      language_code: item.language_code,
      content_json: contentJson
    }
  })

  return {
    campaign: {
      id: campaign.id,
      slug: campaign.slug,
      title: campaign.title,
      default_language: campaign.default_language
    },
    language: languageCode,
    content: parsedContent.slice(0, 30) // Return max 30 items
  }
})
