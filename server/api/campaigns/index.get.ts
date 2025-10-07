import { campaignService } from '../../database/campaigns'

export default defineEventHandler(() => {
  // Only return active campaigns to the public
  const campaigns = campaignService.getAllCampaigns('active')

  return {
    campaigns
  }
})
