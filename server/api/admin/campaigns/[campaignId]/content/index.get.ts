import { prayerContentService } from '../../../../../database/prayer-content'
import { requireAuth } from '../../../../../utils/auth'

export default defineEventHandler((event) => {
  requireAuth(event)

  const campaignId = parseInt(event.context.params?.campaignId || '0')
  const query = getQuery(event)

  if (!campaignId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid campaign ID'
    })
  }

  const options = {
    startDate: query.startDate as string | undefined,
    endDate: query.endDate as string | undefined,
    language: query.language as string | undefined,
    limit: query.limit ? parseInt(query.limit as string) : undefined,
    offset: query.offset ? parseInt(query.offset as string) : undefined
  }

  // If grouped by date is requested, return grouped data
  if (query.grouped === 'true') {
    const grouped = prayerContentService.getCampaignContentGroupedByDate(campaignId, options)

    // For each date, get the content for all languages
    const groupedWithContent = grouped.map(group => {
      const dateContent = prayerContentService.getCampaignPrayerContent(campaignId, {
        startDate: group.date,
        endDate: group.date
      })

      // Parse content_json for each item
      const parsedContent = dateContent.map(item => {
        if (typeof item.content_json === 'string') {
          try {
            return { ...item, content_json: JSON.parse(item.content_json) }
          } catch (e) {
            return item
          }
        }
        return item
      })

      return {
        date: group.date,
        languages: group.languages,
        content: parsedContent
      }
    })

    return {
      content: groupedWithContent,
      total: grouped.length
    }
  }

  const content = prayerContentService.getCampaignPrayerContent(campaignId, options)
  const count = prayerContentService.getContentCount(campaignId)

  // Parse content_json for each item if it's a string
  const parsedContent = content.map(item => {
    if (typeof item.content_json === 'string') {
      try {
        item.content_json = JSON.parse(item.content_json)
      } catch (e) {
        console.error('Failed to parse content_json:', e)
      }
    }
    return item
  })

  return {
    content: parsedContent,
    count,
    total: count
  }
})
