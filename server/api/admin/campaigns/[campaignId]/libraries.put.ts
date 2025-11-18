import { campaignLibraryConfigService } from '#server/database/campaign-library-config'

export default defineEventHandler(async (event) => {
  // Require admin authentication
  await requireAdmin(event)

  const campaignId = parseInt(event.context.params?.campaignId || '0')

  if (!campaignId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid campaign ID'
    })
  }

  const body = await readBody(event)

  // Expect an array of library IDs in order
  if (!Array.isArray(body.library_ids)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'library_ids must be an array'
    })
  }

  try {
    await campaignLibraryConfigService.setCampaignLibraries(campaignId, body.library_ids)

    return {
      success: true
    }
  } catch (error: any) {
    throw createError({
      statusCode: 400,
      statusMessage: error.message || 'Failed to update campaign libraries'
    })
  }
})
