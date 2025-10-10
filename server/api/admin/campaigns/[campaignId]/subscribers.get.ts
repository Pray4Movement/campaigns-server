import { getDatabase } from '#server/database/db'
import { campaignService } from '#server/database/campaigns'
import { requireAuth } from '#server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const campaignId = getRouterParam(event, 'campaignId')

  if (!campaignId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Campaign ID is required'
    })
  }

  // Check if user has access to this campaign
  const hasAccess = await campaignService.userCanAccessCampaign(user.userId, parseInt(campaignId))
  if (!hasAccess) {
    throw createError({
      statusCode: 403,
      statusMessage: 'You do not have access to this campaign'
    })
  }

  const db = getDatabase()

  try {
    // Get all subscribers for this campaign
    const subscribers = await db.prepare(`
      SELECT
        id,
        campaign_id,
        name,
        email,
        phone,
        delivery_method,
        frequency,
        time_preference,
        status,
        tracking_id,
        created_at,
        updated_at
      FROM reminder_signups
      WHERE campaign_id = ?
      ORDER BY created_at DESC
    `).all(campaignId)

    return {
      subscribers
    }
  } catch (error) {
    console.error('Error fetching subscribers:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch subscribers'
    })
  }
})
