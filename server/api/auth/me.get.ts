import { requireAuth, getUserWithRoles } from '#server/utils/auth'
import { userService } from '#server/database/users'

export default defineEventHandler(async (event) => {
  // Use the secure JWT auth check
  const userPayload = requireAuth(event)

  // Get full user data to get verified status
  const user = await userService.getUserById(userPayload.userId)
  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: 'User not found'
    })
  }

  // Get user with roles
  const userWithRoles = await getUserWithRoles(user.id, user.email, user.display_name, user.verified, user.superadmin)

  return {
    user: userWithRoles
  }
})