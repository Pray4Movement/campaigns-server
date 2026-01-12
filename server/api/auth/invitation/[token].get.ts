import { userInvitationService } from '#server/database/user-invitations'
import { handleApiError } from '#server/utils/api-helpers'

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
  } catch (error) {
    handleApiError(error, 'Failed to validate invitation')
  }
})
