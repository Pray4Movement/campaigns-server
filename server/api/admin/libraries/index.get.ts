import { libraryService, PEOPLE_GROUP_LIBRARY } from '#server/database/libraries'

export default defineEventHandler(async (event) => {
  // Require authentication
  await requireAuth(event)

  const query = getQuery(event)
  const search = query.search as string | undefined
  const limit = query.limit ? parseInt(query.limit as string) : undefined
  const offset = query.offset ? parseInt(query.offset as string) : undefined
  const includeVirtual = query.includeVirtual === 'true'

  const allLibraries = await libraryService.getAllLibraries({ search, limit, offset })

  // Filter out people_group libraries from database - use virtual instead
  const libraries = allLibraries.filter(library => library.type !== 'people_group')

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

  // Optionally include virtual People Group library (for prayer-fuel-order page)
  if (includeVirtual) {
    const virtualStats = await libraryService.getLibraryStats(PEOPLE_GROUP_LIBRARY.id)
    librariesWithStats.push({
      ...PEOPLE_GROUP_LIBRARY,
      stats: virtualStats
    })
  }

  return {
    libraries: librariesWithStats,
    count: librariesWithStats.length
  }
})
