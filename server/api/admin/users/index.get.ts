import { userService } from '#server/database/users'
import { roleService } from '#server/database/roles'
import { requireAdmin } from '#server/utils/auth'

export default defineEventHandler(async (event) => {
  // Require admin authentication
  await requireAdmin(event)

  try {
    // Get all users
    const users = await userService.getAllUsers()

    // Get roles for each user
    const usersWithRoles = await Promise.all(
      users.map(async (user) => {
        const roles = await roleService.getUserRoles(user.id)
        return {
          ...user,
          roles: roles.map(r => ({
            id: r.id,
            name: r.name,
            description: r.description
          }))
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
