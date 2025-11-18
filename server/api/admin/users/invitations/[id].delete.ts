import { userInvitationService } from '#server/database/user-invitations'

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
  } catch (error: any) {
    console.error('Error revoking invitation:', error)

    // If it's already a createError, rethrow it
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to revoke invitation'
    })
  }
})
