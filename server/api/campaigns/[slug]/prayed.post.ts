import { campaignService } from '#server/database/campaigns'
import { getDatabase } from '#server/database/db'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const body = await readBody(event)

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

  // Validate request body
  const { userId, duration, timestamp } = body

  if (!duration || !timestamp) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Duration and timestamp are required'
    })
  }

  // Insert prayer activity
  const db = getDatabase()
  const stmt = db.prepare(`
    INSERT INTO prayer_activity (campaign_id, tracking_id, duration, timestamp)
    VALUES (?, ?, ?, ?)
  `)

  try {
    await stmt.run(campaign.id, userId || null, duration, timestamp)

    return {
      success: true,
      message: 'Prayer activity recorded'
    }
  } catch (error: any) {
    console.error('Failed to record prayer activity:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to record prayer activity'
    })
  }
})
