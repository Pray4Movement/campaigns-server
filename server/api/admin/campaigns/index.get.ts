import { peopleGroupService } from '#server/database/people-groups'
import { campaignSubscriptionService } from '#server/database/campaign-subscriptions'

export default defineEventHandler(async (event) => {
  // Require campaigns.view permission
  const user = await requirePermission(event, 'campaigns.view')

  // Get people groups based on user's role and access
  // Admins see all people groups, campaign editors see only assigned ones
  const peopleGroups = await peopleGroupService.getPeopleGroupsForUser(user.userId)

  // Enrich with commitment stats
  const peopleGroupIds = peopleGroups.map(pg => pg.id)
  const commitmentStats = await campaignSubscriptionService.getCommitmentStatsForCampaigns(peopleGroupIds)

  const enrichedCampaigns = peopleGroups.map(pg => {
    const stats = commitmentStats.get(pg.id) || { people_committed: 0, committed_duration: 0 }
    return {
      ...pg,
      title: pg.name,
      people_committed: stats.people_committed,
      committed_duration: stats.committed_duration
    }
  })

  return {
    campaigns: enrichedCampaigns,
    count: enrichedCampaigns.length
  }
})
