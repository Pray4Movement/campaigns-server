import { campaignService } from '#server/database/campaigns'
import { prayerContentService } from '#server/database/prayer-content'

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

  // Get user date from query params or use current date
  const userDate = query.userDate as string || new Date().toISOString().split('T')[0]

  // Extract just the date part (YYYY-MM-DD)
  const date = userDate.split('T')[0]

  // Get language preference (default to campaign's default language)
  const languageCode = (query.language as string) || campaign.default_language || 'en'

  // Get ALL prayer content for the date and language from all libraries
  let allContent = await prayerContentService.getAllPrayerContentByDate(campaign.id, date, languageCode)

  // If no content found in requested language, fall back to campaign default language
  if (allContent.length === 0 && languageCode !== campaign.default_language) {
    allContent = await prayerContentService.getAllPrayerContentByDate(campaign.id, date, campaign.default_language)
  }

  // Get available languages for this date
  const availableLanguages = await prayerContentService.getAvailableLanguages(campaign.id, date)

  // Parse content_json for each content item
  const parsedContent = allContent.map(content => {
    let contentJson = content.content_json
    if (typeof contentJson === 'string') {
      try {
        contentJson = JSON.parse(contentJson)
      } catch (e) {
        console.error('Failed to parse content_json:', e)
      }
    }

    return {
      id: content.id,
      title: content.title,
      language_code: content.language_code,
      content_json: contentJson,
      content_date: content.content_date
    }
  })

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
    content: parsedContent,
    hasContent: parsedContent.length > 0
  }
})
