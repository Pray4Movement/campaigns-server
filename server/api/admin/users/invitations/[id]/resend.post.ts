import { userInvitationService } from '#server/database/user-invitations'
import { requireAuth } from '#server/utils/auth'

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

    // Check if invitation is still pending
    if (invitation.status !== 'pending') {
      throw createError({
        statusCode: 400,
        statusMessage: `Cannot resend ${invitation.status} invitation`
      })
    }

    // Check if invitation has expired
    const now = new Date()
    const expiresAt = new Date(invitation.expires_at)

    if (now > expiresAt) {
      // Auto-expire the invitation
      await userInvitationService.updateInvitationStatus(id, 'expired')
      throw createError({
        statusCode: 400,
        statusMessage: 'Invitation has expired. Please create a new one.'
      })
    }

    // Get the inviter's info for the email
    const { userService } = await import('#server/database/users')
    const inviter = await userService.getUserById(invitation.invited_by)

    if (!inviter) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Inviter not found'
      })
    }

    // Resend invitation email
    try {
      const { sendInvitationEmail } = await import('#server/utils/email')
      await sendInvitationEmail(
        invitation.email,
        invitation.token,
        inviter.display_name || inviter.email,
        invitation.expires_at
      )
    } catch (emailError) {
      console.error('Failed to resend invitation email:', emailError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to send email'
      })
    }

    return {
      success: true,
      message: 'Invitation email resent successfully'
    }
  } catch (error: any) {
    console.error('Error resending invitation:', error)

    // If it's already a createError, rethrow it
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to resend invitation'
    })
  }
})
