import { marketingEmailService } from '#server/database/marketing-emails'
import { marketingEmailQueueService } from '#server/database/marketing-email-queue'

export default defineEventHandler(async (event) => {
  const user = await requirePermission(event, 'campaigns.view')

  const id = Number(getRouterParam(event, 'id'))
  if (!id || isNaN(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid email ID'
    })
  }

  const canAccess = await marketingEmailService.canUserAccessEmail(user.userId, id)
  if (!canAccess) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Email not found'
    })
  }

  const email = await marketingEmailService.getByIdWithCampaign(id)
  if (!email) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Email not found'
    })
  }

  let queueStats = null
  if (email.status !== 'draft') {
    queueStats = await marketingEmailQueueService.getQueueStats(id)
  }

  return {
    email,
    queueStats
  }
})
