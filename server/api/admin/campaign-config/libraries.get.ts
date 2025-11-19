import { defineEventHandler, createError } from 'h3'
import { appConfigService } from '#server/database/app-config'

/**
 * Get global campaign library configuration
 * This returns which libraries are available to all campaigns
 */
export default defineEventHandler(async (event) => {
  try {
    const config = await appConfigService.getConfig('global_campaign_libraries')

    return {
      config: config || { campaignLibraries: [] }
    }
  } catch (error: any) {
    console.error('Error fetching global campaign library config:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch global campaign library configuration'
    })
  }
})
