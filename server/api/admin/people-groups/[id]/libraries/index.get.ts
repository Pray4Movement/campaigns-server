import { libraryService } from '#server/database/libraries'
import { peopleGroupService } from '#server/database/people-groups'
import { getIntParam } from '#server/utils/api-helpers'

export default defineEventHandler(async (event) => {
  // Require content.view permission
  const user = await requirePermission(event, 'content.view')

  const id = getIntParam(event, 'id')

  // Check if user has access to this people group
  const hasAccess = await peopleGroupService.userCanAccessPeopleGroup(user.userId, id)
  if (!hasAccess) {
    throw createError({
      statusCode: 403,
      statusMessage: 'You do not have access to this people group'
    })
  }

  // Get all libraries for this people group
  const libraries = await libraryService.getPeopleGroupLibraries(id)

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
