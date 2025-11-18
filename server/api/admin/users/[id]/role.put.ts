import { roleService } from '#server/database/roles'
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

  // Validate role_id is provided
  if (body.role_id === undefined && body.role_id === null) {
    throw createError({
      statusCode: 400,
      statusMessage: 'role_id is required'
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

    // If role_id is null, remove all roles
    if (body.role_id === null) {
      const currentRoles = await roleService.getUserRoles(userId)
      for (const role of currentRoles) {
        await roleService.removeRoleFromUser(userId, role.id)
      }

      return {
        success: true,
        message: 'User roles removed'
      }
    }

    // Validate role exists
    const role = await roleService.getRoleById(body.role_id)
    if (!role) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Role not found'
      })
    }

    // Remove all existing roles
    const currentRoles = await roleService.getUserRoles(userId)
    for (const currentRole of currentRoles) {
      await roleService.removeRoleFromUser(userId, currentRole.id)
    }

    // Assign new role
    await roleService.assignRoleToUser(userId, body.role_id)

    // Get updated user roles
    const updatedRoles = await roleService.getUserRoles(userId)

    return {
      success: true,
      roles: updatedRoles,
      message: `User role updated to ${role.name}`
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
