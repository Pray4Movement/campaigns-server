/**
 * GET /api/campaigns
 * List all active campaigns with people group images
 */
import { campaignService } from '#server/database/campaigns'
import { peopleGroupService } from '#server/database/people-groups'

export default defineEventHandler(async (event) => {
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

  // Cache for 1 hour at edge (Cloudflare)
  setResponseHeader(event, 'Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=600')

  return {
    campaigns: enrichedCampaigns
  }
})
