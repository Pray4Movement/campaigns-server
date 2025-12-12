import { contactMethodService } from '#server/database/contact-methods'
import { campaignService } from '#server/database/campaigns'

export default defineEventHandler(async (event) => {
  const user = await requirePermission(event, 'campaigns.view')

  const id = Number(getRouterParam(event, 'id'))
  if (!id || isNaN(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid campaign ID'
    })
  }

  const canAccess = await campaignService.userCanAccessCampaign(user.userId, id)
  if (!canAccess) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Campaign not found'
    })
  }

  const campaign = await campaignService.getCampaignById(id)
  if (!campaign) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Campaign not found'
    })
  }

  const contacts = await contactMethodService.getContactsConsentedToCampaign(id)

  return {
    count: contacts.length,
    audience_type: 'campaign',
    campaign_id: id,
    campaign_title: campaign.title
  }
})
