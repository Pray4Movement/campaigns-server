import type { H3Event } from 'h3'
import { roleService } from '#server/database/roles'

// Require admin role - extends base layer's requireAuth
// Note: requireAuth, getAuthUser, and verifyToken are auto-imported from base layer
export async function requireAdmin(event: H3Event) {
  // Get the authenticated user from base layer's requireAuth (auto-imported)
  const user = requireAuth(event)

  // Check if user has admin role
  // userId is a UUID string, not a number
  const isAdmin = await roleService.isAdmin(user.userId)

  if (!isAdmin) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Admin access required'
    })
  }

  return user
}
