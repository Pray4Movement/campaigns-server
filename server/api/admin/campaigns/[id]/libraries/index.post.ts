import { libraryService } from '#server/database/libraries'
import { campaignService } from '#server/database/campaigns'

export default defineEventHandler(async (event) => {
  // Require content.edit permission
  const user = await requirePermission(event, 'content.edit')

  const campaignId = parseInt(event.context.params?.id || '0')

  if (!campaignId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid campaign ID'
    })
  }

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
  } catch (error: any) {
    throw createError({
      statusCode: 400,
      statusMessage: error.message || 'Failed to create library'
    })
  }
})
