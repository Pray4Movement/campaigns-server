import { userInvitationService } from '#server/database/user-invitations'
import { handleApiError } from '#server/utils/api-helpers'

export default defineEventHandler(async (event) => {
  // Require authentication
  await requireAuth(event)

  const id = parseInt(getRouterParam(event, 'id') || '0')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid invitation ID'
    })
  }

  try {
    // Get the invitation
    const invitation = await userInvitationService.getInvitationById(id)

    if (!invitation) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Invitation not found'
      })
    }

    // Revoke the invitation
    const success = await userInvitationService.revokeInvitation(id)

    if (!success) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to revoke invitation'
      })
    }

    return {
      success: true,
      message: 'Invitation revoked successfully'
    }
  } catch (error) {
    handleApiError(error, 'Failed to revoke invitation')
  }
})
