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

  // Get user date from query params or use current date
  const userDate = query.userDate as string || new Date().toISOString().split('T')[0]

  // Extract just the date part (YYYY-MM-DD)
  const date = userDate.split('T')[0]

  // Get language preference (default to campaign's default language)
  const languageCode = (query.language as string) || campaign.default_language || 'en'

  // Get prayer content for the date and language
  let content = prayerContentService.getPrayerContentByDate(campaign.id, date, languageCode)

  // If content not found in requested language, fall back to campaign default language
  if (!content && languageCode !== campaign.default_language) {
    content = prayerContentService.getPrayerContentByDate(campaign.id, date, campaign.default_language)
  }

  // Get available languages for this date
  const availableLanguages = prayerContentService.getAvailableLanguages(campaign.id, date)

  if (!content) {
    return {
      campaign: {
        id: campaign.id,
        slug: campaign.slug,
        title: campaign.title,
        default_language: campaign.default_language
      },
      date,
      language: languageCode,
      availableLanguages,
      content: null,
      message: 'No prayer content available for this date'
    }
  }

  // Parse content_json if it's a string
  if (typeof content.content_json === 'string') {
    try {
      content.content_json = JSON.parse(content.content_json)
    } catch (e) {
      console.error('Failed to parse content_json:', e)
    }
  }

  return {
    campaign: {
      id: campaign.id,
      slug: campaign.slug,
      title: campaign.title,
      default_language: campaign.default_language
    },
    date,
    language: content.language_code,
    availableLanguages,
    content: {
      id: content.id,
      title: content.title,
      language_code: content.language_code,
      content_json: content.content_json,
      content_date: content.content_date
    }
  }
})
