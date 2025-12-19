import { marketingEmailService } from '#server/database/marketing-emails'
import { renderMarketingEmailHtml, tiptapToText } from '#server/utils/marketing-email-template'

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

  const config = useRuntimeConfig()
  const baseUrl = config.public.siteUrl || 'https://example.com'
  const unsubscribeUrl = `${baseUrl}/unsubscribe?id=preview`

  const html = renderMarketingEmailHtml(
    email.content_json,
    email.audience_type === 'campaign' ? email.campaign_title : undefined,
    unsubscribeUrl
  )

  const text = tiptapToText(email.content_json)

  return {
    subject: email.subject,
    html,
    text
  }
})
