import { libraryService } from '#server/database/libraries'
import { peopleGroupService } from '#server/database/people-groups'
import { getIntParam } from '#server/utils/api-helpers'

export default defineEventHandler(async (event) => {
  // Require content.view permission
  const user = await requirePermission(event, 'content.view')

  const campaignId = getIntParam(event, 'campaignId')

  // Check if user has access to this campaign
  const hasAccess = await peopleGroupService.userCanAccessPeopleGroup(user.userId, campaignId)
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
