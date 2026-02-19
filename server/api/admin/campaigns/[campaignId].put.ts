import { peopleGroupService } from '#server/database/people-groups'
import { handleApiError, getIntParam } from '#server/utils/api-helpers'

export default defineEventHandler(async (event) => {
  // Require campaigns.edit permission
  const user = await requirePermission(event, 'campaigns.edit')

  const campaignId = getIntParam(event, 'campaignId')

  // Check if user has access to this campaign
  const hasAccess = await peopleGroupService.userCanAccessPeopleGroup(user.userId, campaignId)
  if (!hasAccess) {
    throw createError({
      statusCode: 403,
      statusMessage: 'You do not have access to this campaign'
    })
  }

  const body = await readBody(event)

  try {
    const peopleGroup = await peopleGroupService.updatePeopleGroup(campaignId, {
      name: body.title,
      slug: body.slug
    })

    if (!peopleGroup) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Campaign not found'
      })
    }

    return {
      success: true,
      campaign: { ...peopleGroup, title: peopleGroup.name }
    }
  } catch (error) {
    handleApiError(error, 'Failed to update campaign', 400)
  }
})
