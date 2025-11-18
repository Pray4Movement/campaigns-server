import { userInvitationService } from '#server/database/user-invitations'

export default defineEventHandler(async (event) => {
  // Require authentication
  await requireAuth(event)

  try {
    // Get all invitations with inviter info
    const invitations = await userInvitationService.getAllInvitationsWithInviter()

    return {
      invitations
    }
  } catch (error: any) {
    console.error('Error fetching invitations:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch invitations'
    })
  }
})
