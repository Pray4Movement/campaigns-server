import { libraryService } from '#server/database/libraries'

export default defineEventHandler(async (event) => {
  // Require authentication
  await requireAuth(event)

  const query = getQuery(event)
  const search = query.search as string | undefined
  const limit = query.limit ? parseInt(query.limit as string) : undefined
  const offset = query.offset ? parseInt(query.offset as string) : undefined

  const libraries = await libraryService.getAllLibraries({ search, limit, offset })

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
