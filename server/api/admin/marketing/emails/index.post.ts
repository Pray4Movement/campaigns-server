import { marketingEmailService } from '#server/database/marketing-emails'
import { handleApiError } from '#server/utils/api-helpers'

export default defineEventHandler(async (event) => {
  const user = await requirePermission(event, 'campaigns.view')

  const body = await readBody(event)

  if (!body.subject) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Subject is required'
    })
  }

  if (!body.content_json) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Content is required'
    })
  }

  if (!body.audience_type || !['doxa', 'campaign'].includes(body.audience_type)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Valid audience_type is required (doxa or campaign)'
    })
  }

  if (body.audience_type === 'campaign' && !body.people_group_id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'people_group_id is required when audience_type is campaign'
    })
  }

  const canSend = await marketingEmailService.canUserSendToAudience(
    user.userId,
    body.audience_type,
    body.people_group_id
  )

  if (!canSend) {
    throw createError({
      statusCode: 403,
      statusMessage: body.audience_type === 'doxa'
        ? 'Only admins can create Doxa-wide emails'
        : 'You do not have access to this people group'
    })
  }

  try {
    const email = await marketingEmailService.create({
      subject: body.subject,
      content_json: body.content_json,
      audience_type: body.audience_type,
      people_group_id: body.audience_type === 'campaign' ? body.people_group_id : null,
      created_by: user.userId
    })

    return {
      success: true,
      email
    }
  } catch (error) {
    handleApiError(error, 'Failed to create email', 400)
  }
})
