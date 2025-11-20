import { userService } from '#server/database/users'
import { roleService, ROLES } from '#server/database/roles'

export default defineEventHandler(async (event) => {
  // Require admin authentication
  await requireAdmin(event)

  try {
    // Get all users
    const users = await userService.getAllUsers()

    // Get role for each user
    const usersWithRoles = await Promise.all(
      users.map(async (user) => {
        const role = await roleService.getUserRole(user.id)
        return {
          ...user,
          role: role ? {
            name: role,
            description: ROLES[role].description
          } : null
        }
      })
    )

    return {
      users: usersWithRoles
    }
  } catch (error: any) {
    console.error('Error fetching users:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch users'
    })
  }
})
