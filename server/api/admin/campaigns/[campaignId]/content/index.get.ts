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
    limit: query.limit ? parseInt(query.limit as string) : undefined,
    offset: query.offset ? parseInt(query.offset as string) : undefined
  }

  const content = prayerContentService.getCampaignPrayerContent(campaignId, options)
  const count = prayerContentService.getContentCount(campaignId)

  return {
    content,
    count,
    total: count
  }
})
