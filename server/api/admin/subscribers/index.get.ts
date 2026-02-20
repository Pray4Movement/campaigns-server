import { subscriberService } from '#server/database/subscribers'
import { roleService } from '#server/database/roles'
import { campaignAccessService } from '#server/database/campaign-access'
import { handleApiError } from '#server/utils/api-helpers'

export default defineEventHandler(async (event) => {
  const user = await requirePermission(event, 'campaigns.view')

  const query = getQuery(event)
  const search = query.search as string | undefined
  const peopleGroupId = query.people_group_id ? parseInt(query.people_group_id as string) : undefined

  try {
    // Determine accessible people groups for non-admin users
    const isAdmin = await roleService.isAdmin(user.userId)
    let accessiblePeopleGroupIds: number[] | undefined

    if (!isAdmin) {
      accessiblePeopleGroupIds = await campaignAccessService.getUserCampaigns(user.userId)

      // If user has no people group access, return empty list
      if (accessiblePeopleGroupIds.length === 0) {
        return { subscribers: [] }
      }

      // If filtering by people group, verify user has access
      if (peopleGroupId && !accessiblePeopleGroupIds.includes(peopleGroupId)) {
        throw createError({
          statusCode: 403,
          statusMessage: 'You do not have access to this people group'
        })
      }
    }

    const subscribers = await subscriberService.getAllSubscribersWithSubscriptions({
      search,
      peopleGroupId: peopleGroupId,
      accessiblePeopleGroupIds: accessiblePeopleGroupIds
    })

    return {
      subscribers
    }
  } catch (error) {
    handleApiError(error, 'Failed to fetch subscribers')
  }
})
