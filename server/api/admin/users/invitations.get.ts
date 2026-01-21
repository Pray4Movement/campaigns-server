import { userInvitationService } from '#server/database/user-invitations'
import { handleApiError } from '#server/utils/api-helpers'

export default defineEventHandler(async (event) => {
  // Require admin authentication
  await requireAdmin(event)

  try {
    // Get all invitations with inviter info
    const invitations = await userInvitationService.getAllInvitationsWithInviter()

    return {
      invitations
    }
  } catch (error) {
    handleApiError(error, 'Failed to fetch invitations')
  }
})
