import { campaignService } from '#server/database/campaigns'
import { peopleGroupService } from '#server/database/people-groups'

export default defineEventHandler(async () => {
  // Only return active campaigns to the public
  const campaigns = await campaignService.getAllCampaigns('active')

  // Enrich campaigns with people group image URLs
  const enrichedCampaigns = await Promise.all(
    campaigns.map(async (campaign) => {
      let image_url = null
      if (campaign.dt_id) {
        const pg = await peopleGroupService.getPeopleGroupByDtId(campaign.dt_id)
        image_url = pg?.image_url || null
      }
      return { ...campaign, image_url }
    })
  )

  return {
    campaigns: enrichedCampaigns
  }
})
