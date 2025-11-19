import { defineEventHandler, createError } from 'h3'
import { appConfigService } from '#server/database/app-config'

/**
 * Get global campaign library configuration
 * This returns which libraries are available to all campaigns and the global start date
 */
export default defineEventHandler(async (event) => {
  try {
    const config = await appConfigService.getConfig('global_campaign_libraries')
    const startDate = await appConfigService.getConfig<string>('global_campaign_start_date')

    return {
      config: {
        campaignLibraries: config?.campaignLibraries || [],
        globalStartDate: startDate
      }
    }
  } catch (error: any) {
    console.error('Error fetching global campaign library config:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch global campaign library configuration'
    })
  }
})
