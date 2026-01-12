/**
 * POST /api/campaigns/:slug/prayer-content/:date/session
 * Record a prayer session for analytics and tracking
 */
import { campaignService } from '#server/database/campaigns'
import { getDatabase } from '#server/database/db'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const dateParam = getRouterParam(event, 'date')
  const body = await readBody(event)

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Campaign slug is required'
    })
  }

  if (!dateParam) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Date is required'
    })
  }

  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(dateParam)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid date format. Expected YYYY-MM-DD'
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
  const { sessionId, trackingId, duration, timestamp } = body

  if (!sessionId || duration === undefined || !timestamp) {
    throw createError({
      statusCode: 400,
      statusMessage: 'sessionId, duration, and timestamp are required'
    })
  }

  const db = getDatabase()

  try {
    // Upsert: Insert or update based on session_id
    const stmt = db.prepare(`
      INSERT INTO prayer_activity (campaign_id, session_id, tracking_id, duration, timestamp, content_date)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT (session_id) WHERE session_id IS NOT NULL
      DO UPDATE SET duration = EXCLUDED.duration, timestamp = EXCLUDED.timestamp, content_date = EXCLUDED.content_date
    `)

    await stmt.run(campaign.id, sessionId, trackingId || null, duration, timestamp, dateParam)

    return {
      success: true,
      message: 'Prayer session recorded'
    }
  } catch (error: any) {
    console.error('Failed to record prayer session:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to record prayer session'
    })
  }
})
