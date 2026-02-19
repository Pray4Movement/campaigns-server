import { peopleGroupService } from '#server/database/people-groups'
import { getIntParam } from '#server/utils/api-helpers'

export default defineEventHandler(async (event) => {
  // Require campaigns.delete permission
  const user = await requirePermission(event, 'campaigns.delete')

  const campaignId = getIntParam(event, 'campaignId')

  // Check if user has access to this campaign
  const hasAccess = await peopleGroupService.userCanAccessPeopleGroup(user.userId, campaignId)
  if (!hasAccess) {
    throw createError({
      statusCode: 403,
      statusMessage: 'You do not have access to this campaign'
    })
  }

  const success = await peopleGroupService.deletePeopleGroup(campaignId)

  if (!success) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Campaign not found'
    })
  }

  return {
    success: true,
    message: 'Campaign deleted successfully'
  }
})
