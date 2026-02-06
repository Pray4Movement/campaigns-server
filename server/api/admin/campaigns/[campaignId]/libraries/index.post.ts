import { libraryService } from '#server/database/libraries'
import { campaignService } from '#server/database/campaigns'
import { handleApiError, getIntParam } from '#server/utils/api-helpers'

export default defineEventHandler(async (event) => {
  // Require content.edit permission
  const user = await requirePermission(event, 'content.edit')

  const campaignId = getIntParam(event, 'campaignId')

  // Check if user has access to this campaign
  const hasAccess = await campaignService.userCanAccessCampaign(user.userId, campaignId)
  if (!hasAccess) {
    throw createError({
      statusCode: 403,
      statusMessage: 'You do not have access to this campaign'
    })
  }

  const body = await readBody(event)

  // Validate required fields
  if (!body.name) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Library name is required'
    })
  }

  if (!body.library_key) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Library key is required'
    })
  }

  try {
    const library = await libraryService.createLibrary({
      name: body.name,
      description: body.description,
      repeating: body.repeating,
      campaign_id: campaignId,
      library_key: body.library_key
    })

    return {
      success: true,
      library
    }
  } catch (error) {
    handleApiError(error, 'Failed to create library', 400)
  }
})
