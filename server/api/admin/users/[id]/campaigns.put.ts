import { campaignAccessService } from '#server/database/campaign-access'
import { userService } from '#server/database/users'
import { handleApiError } from '#server/utils/api-helpers'

export default defineEventHandler(async (event) => {
  // Require admin authentication
  await requireAdmin(event)

  // Get user ID from route params (UUID string)
  const userId = getRouterParam(event, 'id')
  if (!userId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid user ID'
    })
  }

  // Get request body
  const body = await readBody(event)

  // Validate campaign_ids is an array
  if (!Array.isArray(body.campaign_ids)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'campaign_ids must be an array'
    })
  }

  try {
    // Check if user exists
    const user = await userService.getUserById(userId)
    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    }

    // Remove all existing campaign access for this user
    await campaignAccessService.removeUserFromAllCampaigns(userId)

    // Add new campaign access
    if (body.campaign_ids.length > 0) {
      await campaignAccessService.assignUserToCampaigns(userId, body.campaign_ids)
    }

    return {
      success: true,
      message: `User assigned to ${body.campaign_ids.length} campaign(s)`,
      campaign_ids: body.campaign_ids
    }
  } catch (error) {
    handleApiError(error, 'Failed to update user campaigns')
  }
})
