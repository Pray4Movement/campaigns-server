import type { H3Event } from 'h3'
import jwt from 'jsonwebtoken'
import { roleService } from '#server/database/roles'

export interface JWTPayload {
  userId: number
  email: string
  display_name?: string
}

export interface UserWithRoles {
  id: number
  email: string
  display_name: string
  verified: boolean
  role: string | null
  isAdmin: boolean
  isSuperAdmin: boolean
}

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

// Require specific permission - checks user's role permissions
export async function requirePermission(event: H3Event, permission: string) {
  // Get the authenticated user from base layer's requireAuth (auto-imported)
  const user = requireAuth(event)

  // Check if user has the required permission
  const hasPermission = await roleService.userHasPermission(user.userId, permission)

  if (!hasPermission) {
    throw createError({
      statusCode: 403,
      statusMessage: `Permission required: ${permission}`
    })
  }

  return user
}

// Generate JWT token
export function generateToken(payload: JWTPayload): string {
  const config = useRuntimeConfig()
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' })
}

// Set auth cookie
export function setAuthCookie(event: H3Event, token: string) {
  setCookie(event, 'auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  })
}

// Get user with their role
export async function getUserWithRoles(userId: string, userEmail: string, displayName: string, verified: boolean, superadmin: boolean): Promise<UserWithRoles> {
  const role = await roleService.getUserRole(userId)
  const isAdmin = role === 'admin'

  return {
    id: userId as any, // Keep as any for backward compatibility
    email: userEmail,
    display_name: displayName,
    verified,
    role,
    isAdmin,
    isSuperAdmin: superadmin
  }
}
