import { peopleGroupService } from '#server/database/people-groups'
import { campaignAccessService } from '#server/database/campaign-access'
import { roleService } from '#server/database/roles'
import { handleApiError } from '#server/utils/api-helpers'

export default defineEventHandler(async (event) => {
  // Require campaigns.create permission - both admins and campaign_editors can create campaigns
  const user = await requirePermission(event, 'campaigns.create')

  const body = await readBody(event)

  // Validate required fields
  if (!body.title) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Title is required'
    })
  }

  try {
    const slug = await peopleGroupService.generateUniqueSlug(body.title)
    const dt_id = body.dt_id || `manual-${slug}`

    const peopleGroup = await peopleGroupService.createPeopleGroup({
      dt_id,
      name: body.title
    })

    // Set the slug on the newly created people group
    await peopleGroupService.updatePeopleGroup(peopleGroup.id, { slug })

    // Automatically grant creator access if they're not an admin
    // (admins already have access to all campaigns)
    const isAdmin = await roleService.isAdmin(user.userId)
    if (!isAdmin) {
      await campaignAccessService.assignUserToCampaign(user.userId, peopleGroup.id)
    }

    return {
      success: true,
      campaign: { ...peopleGroup, title: peopleGroup.name, slug }
    }
  } catch (error) {
    handleApiError(error, 'Failed to create campaign', 400)
  }
})
