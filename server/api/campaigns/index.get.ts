import { campaignService } from '#server/database/campaigns'

export default defineEventHandler(async () => {
  // Only return active campaigns to the public
  const campaigns = await campaignService.getAllCampaigns('active')

  return {
    campaigns
  }
})
