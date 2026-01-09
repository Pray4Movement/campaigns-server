import { libraryService, type LibraryExportData, PEOPLE_GROUP_LIBRARY_ID, DAILY_PEOPLE_GROUP_LIBRARY_ID } from '#server/database/libraries'
import { libraryContentService } from '#server/database/library-content'

export default defineEventHandler(async (event) => {
  // Require authentication
  await requireAuth(event)

  const id = parseInt(event.context.params?.libraryId || '0')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid library ID'
    })
  }

  // Cannot export virtual libraries
  if (id === PEOPLE_GROUP_LIBRARY_ID || id === DAILY_PEOPLE_GROUP_LIBRARY_ID) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Cannot export virtual libraries'
    })
  }

  const library = await libraryService.getLibraryById(id)

  if (!library) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Library not found'
    })
  }

  // Get all content for export
  const content = await libraryContentService.getAllContentForExport(id)

  // Calculate stats
  const languageCoverage: Record<string, number> = {}
  const daySet = new Set<number>()

  for (const item of content) {
    daySet.add(item.day_number)
    languageCoverage[item.language_code] = (languageCoverage[item.language_code] || 0) + 1
  }

  const exportData: LibraryExportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    library: {
      name: library.name,
      description: library.description,
      type: library.type,
      repeating: library.repeating,
      library_key: library.library_key
    },
    content,
    stats: {
      totalDays: daySet.size,
      totalContentItems: content.length,
      languageCoverage
    }
  }

  return exportData
})
