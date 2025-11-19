import { defineEventHandler, createError, readBody } from 'h3'
import { appConfigService } from '#server/database/app-config'

/**
 * Update global campaign library configuration
 * This sets which libraries are available to all campaigns and the global start date
 */
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    if (!body.library_ids || !Array.isArray(body.library_ids)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'library_ids must be an array'
      })
    }

    if (!body.global_start_date) {
      throw createError({
        statusCode: 400,
        statusMessage: 'global_start_date is required'
      })
    }

    // Create config object with library IDs and their order
    const config = {
      campaignLibraries: body.library_ids.map((libraryId: number, index: number) => ({
        libraryId,
        order: index + 1
      }))
    }

    // Save library configuration
    await appConfigService.setConfig('global_campaign_libraries', config)

    // Save global start date
    await appConfigService.setConfig('global_campaign_start_date', body.global_start_date)

    return {
      success: true,
      config: {
        ...config,
        globalStartDate: body.global_start_date
      }
    }
  } catch (error: any) {
    console.error('Error updating global campaign library config:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to update global campaign library configuration'
    })
  }
})
