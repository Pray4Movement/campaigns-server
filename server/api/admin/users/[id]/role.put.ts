import { roleService, type RoleName } from '#server/database/roles'
import { userService } from '#server/database/users'

export default defineEventHandler(async (event) => {
  // Require admin authentication
  await requireAdmin(event)

  // Get user ID from route params (UUID string)
  const userId = getRouterParam(event, 'id')
  if (!userId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid user ID'
    })
  }

  // Get request body
  const body = await readBody(event)

  // Validate role is provided (can be null to remove role)
  if (body.role === undefined) {
    throw createError({
      statusCode: 400,
      statusMessage: 'role is required (use null to remove role)'
    })
  }

  try {
    // Check if user exists
    const user = await userService.getUserById(userId)
    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    }

    // If role is null, remove the user's role
    if (body.role === null) {
      await roleService.setUserRole(userId, null)

      return {
        success: true,
        message: 'User role removed'
      }
    }

    // Validate role name
    const roleConfig = roleService.getRoleByName(body.role)
    if (!roleConfig) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Invalid role. Valid roles: admin, campaign_editor'
      })
    }

    // Set new role
    await roleService.setUserRole(userId, body.role as RoleName)

    return {
      success: true,
      role: body.role,
      message: `User role updated to ${body.role}`
    }
  } catch (error: any) {
    console.error('Error updating user role:', error)

    // If it's already a createError, rethrow it
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to update user role'
    })
  }
})
