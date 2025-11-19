import { defineEventHandler, getRouterParam, createError, getQuery } from 'h3'
import { appConfigService } from '#server/database/app-config'
import { libraryContentService } from '#server/database/library-content'
import { libraryService } from '#server/database/libraries'

/**
 * Get library content for a campaign based on global library configuration
 * This endpoint fetches content from all globally configured libraries
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
  const startDay = query.startDay ? Number(query.startDay) : undefined
  const endDay = query.endDay ? Number(query.endDay) : undefined
  const language = query.language as string | undefined
  const grouped = query.grouped === 'true'

  try {
    // Get global library configuration
    const globalConfig = await appConfigService.getConfig('global_campaign_libraries')

    if (!globalConfig || !globalConfig.campaignLibraries) {
      return {
        content: []
      }
    }

    const libraryConfigs = globalConfig.campaignLibraries

    // Fetch content from each library
    const allContent: any[] = []
    const libraryNames: { [key: number]: string } = {}

    for (const config of libraryConfigs) {
      // Get library name for reference
      const library = await libraryService.getLibraryById(config.libraryId)
      if (library) {
        libraryNames[config.libraryId] = library.name
      }

      // Fetch content from this library
      const content = await libraryContentService.getLibraryContent(config.libraryId, {
        startDay,
        endDay,
        language
      })

      // Add library info to each content item
      content.forEach(item => {
        allContent.push({
          ...item,
          library_id: config.libraryId,
          library_name: libraryNames[config.libraryId],
          library_order: config.order
        })
      })
    }

    // Sort by day number, then by library order
    allContent.sort((a, b) => {
      if (a.day_number !== b.day_number) {
        return a.day_number - b.day_number
      }
      return a.library_order - b.library_order
    })

    if (grouped) {
      // Group content by day number
      const groupedByDay = new Map<number, any[]>()

      allContent.forEach(item => {
        if (!groupedByDay.has(item.day_number)) {
          groupedByDay.set(item.day_number, [])
        }
        groupedByDay.get(item.day_number)!.push(item)
      })

      const groupedContent = Array.from(groupedByDay.entries()).map(([dayNumber, content]) => {
        const languages = Array.from(new Set(content.map(c => c.language_code)))
        return {
          dayNumber,
          languages,
          content
        }
      })

      return {
        content: groupedContent
      }
    }

    return {
      content: allContent
    }
  } catch (error: any) {
    console.error('Error fetching campaign library content:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch library content for campaign'
    })
  }
})
