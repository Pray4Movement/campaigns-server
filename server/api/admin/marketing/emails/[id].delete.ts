import { marketingEmailService } from '#server/database/marketing-emails'

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

  try {
    const deleted = await marketingEmailService.delete(id)
    if (!deleted) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Email not found'
      })
    }

    return {
      success: true
    }
  } catch (error: any) {
    throw createError({
      statusCode: 400,
      statusMessage: error.message || 'Failed to delete email'
    })
  }
})
