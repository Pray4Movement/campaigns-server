import { roleService } from '#server/database/roles'

export default defineEventHandler(async (event) => {
  // Require admin authentication
  await requireAdmin(event)

  try {
    const roles = await roleService.getAllRoles()

    return {
      success: true,
      roles
    }
  } catch (error: any) {
    console.error('Error fetching roles:', error)

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch roles'
    })
  }
})
