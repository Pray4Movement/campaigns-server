import { campaignLibraryConfigService } from '#server/database/campaign-library-config'
import { libraryService } from '#server/database/libraries'

export default defineEventHandler(async (event) => {
  // Require authentication
  await requireAuth(event)

  const campaignId = parseInt(event.context.params?.campaignId || '0')

  if (!campaignId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid campaign ID'
    })
  }

  const configs = await campaignLibraryConfigService.getCampaignLibraries(campaignId)

  // Get library details for each config
  const librariesWithDetails = await Promise.all(
    configs.map(async (config) => {
      const library = await libraryService.getLibraryById(config.library_id)
      return {
        ...config,
        library
      }
    })
  )

  return {
    libraries: librariesWithDetails
  }
})
