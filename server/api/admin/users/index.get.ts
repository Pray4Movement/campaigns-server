import { userService } from '#server/database/users'
import { requireAuth } from '#server/utils/auth'

export default defineEventHandler(async (event) => {
  // Require authentication
  await requireAuth(event)

  try {
    // Get all users
    const users = await userService.getAllUsers()

    return {
      users
    }
  } catch (error: any) {
    console.error('Error fetching users:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch users'
    })
  }
})
