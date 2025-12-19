import { marketingEmailService } from '#server/database/marketing-emails'

export default defineEventHandler(async (event) => {
  const user = await requirePermission(event, 'campaigns.view')

  const query = getQuery(event)
  const filters = {
    status: query.status as 'draft' | 'queued' | 'sending' | 'sent' | 'failed' | undefined,
    audience_type: query.audience_type as 'doxa' | 'campaign' | undefined,
    campaign_id: query.campaign_id ? Number(query.campaign_id) : undefined
  }

  const emails = await marketingEmailService.listForUser(user.userId, filters)

  return {
    emails,
    count: emails.length
  }
})
