import { defineEventHandler, getRouterParam, createError, getQuery } from 'h3'
import { appConfigService } from '#server/database/app-config'
import { libraryContentService } from '#server/database/library-content'
import { libraryService } from '#server/database/libraries'
import { handleApiError } from '#server/utils/api-helpers'

interface LibraryConfig {
  libraryId: number
  order: number
}

interface RowConfig {
  rowIndex: number
  libraries: LibraryConfig[]
}

interface LibraryInfo {
  id: number
  name: string
  totalDays: number
}

/**
 * Get library content for a campaign based on global library configuration
 *
 * Row-based scheduling: Each row runs in parallel, libraries within a row run sequentially.
 * For campaign day N, we determine which library in each row contains that day.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const campaignIdParam = getRouterParam(event, 'campaignId')
  const campaignId = Number(campaignIdParam)

  if (!campaignId || isNaN(campaignId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid campaign ID'
    })
  }

  const query = getQuery(event)
  const campaignDay = query.day ? Number(query.day) : undefined
  const language = query.language as string | undefined

  try {
    // Get global library configuration
    const globalConfig = await appConfigService.getConfig('global_campaign_libraries')

    if (!globalConfig || !globalConfig.rows || globalConfig.rows.length === 0) {
      return {
        content: []
      }
    }

    const rows: RowConfig[] = globalConfig.rows

    // Cache library info (name and total days)
    const libraryInfoCache: { [key: number]: LibraryInfo } = {}

    async function getLibraryInfo(libraryId: number): Promise<LibraryInfo | null> {
      if (libraryInfoCache[libraryId]) {
        return libraryInfoCache[libraryId]
      }

      const library = await libraryService.getLibraryById(libraryId)
      if (!library) return null

      // Get total days for this library
      const stats = await libraryService.getLibraryStats(libraryId)

      libraryInfoCache[libraryId] = {
        id: libraryId,
        name: library.name,
        totalDays: stats?.totalDays || 0
      }

      return libraryInfoCache[libraryId]
    }

    // If a specific campaign day is requested, calculate which library/day for each row
    if (campaignDay) {
      const allContent: any[] = []

      for (const row of rows) {
        // Find which library in this row contains the campaign day
        let accumulatedDays = 0

        for (const libConfig of row.libraries) {
          const libraryInfo = await getLibraryInfo(libConfig.libraryId)
          if (!libraryInfo || libraryInfo.totalDays === 0) continue

          const libraryStartDay = accumulatedDays + 1
          const libraryEndDay = accumulatedDays + libraryInfo.totalDays

          if (campaignDay >= libraryStartDay && campaignDay <= libraryEndDay) {
            // This library contains the requested day
            const dayNumberInLibrary = campaignDay - accumulatedDays

            // Fetch content for this specific day
            const content = await libraryContentService.getLibraryContent(libConfig.libraryId, {
              startDay: dayNumberInLibrary,
              endDay: dayNumberInLibrary,
              language
            })

            content.forEach(item => {
              allContent.push({
                ...item,
                library_id: libConfig.libraryId,
                library_name: libraryInfo.name,
                row_index: row.rowIndex,
                campaign_day: campaignDay,
                day_in_library: dayNumberInLibrary
              })
            })

            break // Found the library for this row, move to next row
          }

          accumulatedDays += libraryInfo.totalDays
        }
        // If campaignDay exceeds all libraries in row, nothing is returned for this row
      }

      // Sort by row index
      allContent.sort((a, b) => a.row_index - b.row_index)

      return {
        content: allContent,
        campaignDay
      }
    }

    // If no specific day requested, return all content with row/scheduling metadata
    const allContent: any[] = []

    for (const row of rows) {
      let accumulatedDays = 0

      for (const libConfig of row.libraries) {
        const libraryInfo = await getLibraryInfo(libConfig.libraryId)
        if (!libraryInfo) continue

        const libraryStartDay = accumulatedDays + 1

        // Fetch all content from this library
        const content = await libraryContentService.getLibraryContent(libConfig.libraryId, {
          language
        })

        content.forEach(item => {
          const campaignDayForItem = accumulatedDays + item.day_number
          allContent.push({
            ...item,
            library_id: libConfig.libraryId,
            library_name: libraryInfo.name,
            row_index: row.rowIndex,
            library_start_day: libraryStartDay,
            campaign_day: campaignDayForItem,
            day_in_library: item.day_number
          })
        })

        accumulatedDays += libraryInfo.totalDays
      }
    }

    // Sort by campaign day, then by row index
    allContent.sort((a, b) => {
      if (a.campaign_day !== b.campaign_day) {
        return a.campaign_day - b.campaign_day
      }
      return a.row_index - b.row_index
    })

    return {
      content: allContent
    }
  } catch (error) {
    handleApiError(error, 'Failed to fetch library content for campaign')
  }
})
