import { subscriberService } from '#server/database/subscribers'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const query = getQuery(event)
  const search = query.search as string | undefined
  const campaignId = query.campaign_id ? parseInt(query.campaign_id as string) : undefined

  try {
    const subscribers = await subscriberService.getAllSubscribersWithSubscriptions({
      search,
      campaignId
    })

    return {
      subscribers
    }
  } catch (error: any) {
    console.error('Error fetching subscribers:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch subscribers'
    })
  }
})
