import { campaignService } from '#server/database/campaigns'
import { campaignAccessService } from '#server/database/campaign-access'
import { roleService } from '#server/database/roles'

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
    const campaign = await campaignService.createCampaign({
      title: body.title,
      description: body.description,
      slug: body.slug,
      status: body.status || 'active'
    })

    // Automatically grant creator access if they're not an admin
    // (admins already have access to all campaigns)
    const isAdmin = await roleService.isAdmin(user.userId)
    if (!isAdmin) {
      await campaignAccessService.assignUserToCampaign(user.userId, campaign.id)
    }

    return {
      success: true,
      campaign
    }
  } catch (error: any) {
    throw createError({
      statusCode: 400,
      statusMessage: error.message || 'Failed to create campaign'
    })
  }
})
