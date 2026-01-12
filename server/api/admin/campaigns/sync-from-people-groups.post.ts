import { peopleGroupService } from '../../../database/people-groups'
import { campaignService } from '../../../database/campaigns'
import { handleApiError, getErrorMessage } from '#server/utils/api-helpers'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  try {
    const peopleGroups = await peopleGroupService.getAllPeopleGroups()

    let created = 0
    let updated = 0
    let skipped = 0
    let errors = 0

    for (const group of peopleGroups) {
      try {
        // Parse metadata to get slug
        let metadata: Record<string, any> = {}
        if (group.metadata) {
          try {
            metadata = JSON.parse(group.metadata)
          } catch {
            console.error(`Failed to parse metadata for people group ${group.dt_id}`)
            skipped++
            continue
          }
        }

        const slug = metadata.slug
        if (!slug) {
          console.log(`Skipping people group ${group.name} - no slug in metadata`)
          skipped++
          continue
        }

        // Check if campaign exists with this dt_id
        const existingCampaign = await campaignService.getCampaignByDtId(group.dt_id)

        if (existingCampaign) {
          // Update existing campaign
          await campaignService.updateCampaign(existingCampaign.id, {
            title: group.name,
            slug: slug
          })
          updated++
        } else {
          // Create new campaign
          await campaignService.createCampaign({
            title: group.name,
            slug: slug,
            description: '',
            status: 'active',
            default_language: 'en',
            dt_id: group.dt_id
          })
          created++
        }
      } catch (err) {
        console.error(`Error processing people group ${group.dt_id}:`, getErrorMessage(err))
        errors++
      }
    }

    const message = `Sync completed: ${created} created, ${updated} updated, ${skipped} skipped, ${errors} errors`

    return {
      success: true,
      message,
      stats: {
        total: peopleGroups.length,
        created,
        updated,
        skipped,
        errors
      }
    }
  } catch (error) {
    handleApiError(error, 'Failed to sync campaigns from people groups')
  }
})
