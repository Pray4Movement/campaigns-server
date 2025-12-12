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

  // Get language preference (default to campaign's default language)
  const languageCode = (query.language as string) || campaign.default_language || 'en'

  // Get current date to exclude today and future dates
  const today = new Date().toISOString().split('T')[0]!

  // Get past prayer content (limit to 30 most recent)
  const pastContent = await prayerContentService.getCampaignPrayerContent(campaign.id, {
    endDate: today,
    language: languageCode,
    limit: 31 // Get 31 so we can exclude today
  })

  // Filter out today's content and group by unique dates
  const dateMap = new Map<string, any>()

  for (const item of pastContent) {
    const itemDate = typeof item.content_date === 'string'
      ? item.content_date.split('T')[0]
      : new Date(item.content_date).toISOString().split('T')[0]

    // Skip today and future dates
    if (!itemDate || itemDate >= today) continue

    // Only keep first content item for each unique date
    if (!dateMap.has(itemDate)) {
      let contentJson = item.content_json
      if (typeof contentJson === 'string') {
        try {
          contentJson = JSON.parse(contentJson)
        } catch (e) {
          console.error('Failed to parse content_json:', e)
        }
      }

      dateMap.set(itemDate, {
        id: item.id,
        title: item.title,
        content_date: item.content_date,
        language_code: item.language_code,
        content_json: contentJson
      })
    }
  }

  // Convert map to array and sort by date DESC
  const uniqueContent = Array.from(dateMap.values())
    .sort((a, b) => b.content_date.localeCompare(a.content_date))
    .slice(0, 30) // Return max 30 unique dates

  return {
    campaign: {
      id: campaign.id,
      slug: campaign.slug,
      title: campaign.title,
      default_language: campaign.default_language
    },
    language: languageCode,
    content: uniqueContent
  }
})
