import { campaignService } from '#server/database/campaigns'
import { prayerContentService } from '#server/database/prayer-content'
import { appConfigService } from '#server/database/app-config'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const dayNumberParam = getRouterParam(event, 'dayNumber')
  const query = getQuery(event)

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Campaign slug is required'
    })
  }

  if (!dayNumberParam) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Day number is required'
    })
  }

  const dayNumber = parseInt(dayNumberParam)
  if (isNaN(dayNumber) || dayNumber < 1) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid day number. Must be a positive integer'
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

  // Convert day number to date
  const globalStartDate = await appConfigService.getConfig<string>('global_campaign_start_date')

  if (!globalStartDate) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Global campaign start date is not configured'
    })
  }

  const startDate = new Date(globalStartDate)
  startDate.setDate(startDate.getDate() + (dayNumber - 1))
  const date = startDate.toISOString().split('T')[0]!

  // Get language preference (default to campaign's default language)
  const languageCode = (query.language as string) || campaign.default_language || 'en'

  // Get ALL prayer content for the day and language from all libraries
  const defaultLang = campaign.default_language || 'en'
  let allContent = await prayerContentService.getAllPrayerContentByDate(campaign.id, date, languageCode)

  // If no content found in requested language, fall back to campaign default language
  if (allContent.length === 0 && languageCode !== defaultLang) {
    allContent = await prayerContentService.getAllPrayerContentByDate(campaign.id, date, defaultLang)
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
    dayNumber,
    date,
    language: languageCode,
    availableLanguages,
    content: parsedContent,
    hasContent: parsedContent.length > 0
  }
})
