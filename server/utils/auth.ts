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
  roles: string[]
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

// Get user with their roles
export async function getUserWithRoles(userId: number, userEmail: string, displayName: string, verified: boolean, superadmin: boolean): Promise<UserWithRoles> {
  const roles = await roleService.getUserRoles(userId)
  const roleNames = roles.map(r => r.name)
  const isAdmin = roleNames.includes('admin')

  return {
    id: userId,
    email: userEmail,
    display_name: displayName,
    verified,
    roles: roleNames,
    isAdmin,
    isSuperAdmin: superadmin
  }
}
