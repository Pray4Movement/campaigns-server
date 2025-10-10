import { userInvitationService } from '#server/database/user-invitations'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')

  if (!token) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invitation token is required'
    })
  }

  try {
    // Validate the invitation
    const validation = await userInvitationService.validateInvitation(token)

    if (!validation.valid) {
      throw createError({
        statusCode: 400,
        statusMessage: validation.reason || 'Invalid invitation'
      })
    }

    // Return invitation details (without sensitive info)
    return {
      valid: true,
      invitation: {
        email: validation.invitation!.email,
        expires_at: validation.invitation!.expires_at
      }
    }
  } catch (error: any) {
    console.error('Error validating invitation:', error)

    // If it's already a createError, rethrow it
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to validate invitation'
    })
  }
})
