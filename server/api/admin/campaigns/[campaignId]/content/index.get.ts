import { prayerContentService } from '#server/database/prayer-content'
import { peopleGroupService } from '#server/database/people-groups'
import { getIntParam } from '#server/utils/api-helpers'

export default defineEventHandler(async (event) => {
  // Require content.view permission
  const user = await requirePermission(event, 'content.view')

  const campaignId = getIntParam(event, 'campaignId')
  const query = getQuery(event)

  // Check if user has access to this campaign
  const hasAccess = await peopleGroupService.userCanAccessPeopleGroup(user.userId, campaignId)
  if (!hasAccess) {
    throw createError({
      statusCode: 403,
      statusMessage: 'You do not have access to this campaign'
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
    const grouped = await prayerContentService.getCampaignContentGroupedByDate(campaignId, options)

    // For each date, get the content for all languages
    const groupedWithContent = await Promise.all(grouped.map(async (group) => {
      const dateContent = await prayerContentService.getCampaignPrayerContent(campaignId, {
        startDate: group.date,
        endDate: group.date
      })

      // Parse content_json and format date for each item
      const parsedContent = dateContent.map(item => {
        const parsed = { ...item }

        if (typeof parsed.content_json === 'string') {
          try {
            parsed.content_json = JSON.parse(parsed.content_json)
          } catch (e) {
            // Keep as is if parse fails
          }
        }

        return parsed
      })

      return {
        date: group.date,
        languages: group.languages,
        content: parsedContent
      }
    }))

    return {
      content: groupedWithContent,
      total: grouped.length
    }
  }

  const content = await prayerContentService.getCampaignPrayerContent(campaignId, options)
  const count = await prayerContentService.getContentCount(campaignId)

  // Parse content_json and format date for each item
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
