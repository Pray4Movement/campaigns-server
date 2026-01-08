import { libraryService } from '#server/database/libraries'
import { campaignService } from '#server/database/campaigns'

export default defineEventHandler(async (event) => {
  // Require content.view permission
  const user = await requirePermission(event, 'content.view')

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

  // Get all libraries for this campaign
  const libraries = await libraryService.getCampaignLibraries(campaignId)

  // Get stats for each library
  const librariesWithStats = await Promise.all(
    libraries.map(async (library) => {
      const stats = await libraryService.getLibraryStats(library.id)
      return {
        ...library,
        stats
      }
    })
  )

  return {
    libraries: librariesWithStats,
    count: librariesWithStats.length
  }
})
