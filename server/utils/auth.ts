import jwt from 'jsonwebtoken'
import type { H3Event } from 'h3'

export interface JWTPayload {
  userId: number
  email: string
  display_name?: string
}

export function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET || useRuntimeConfig().jwtSecret
  if (!secret) {
    throw new Error('JWT_SECRET is required but not configured')
  }
  return secret
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, getJWTSecret(), { expiresIn: '7d' })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, getJWTSecret()) as JWTPayload
  } catch (error) {
    return null
  }
}

export function requireAuth(event: H3Event): JWTPayload {
  const token = getCookie(event, 'auth-token')
  
  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required'
    })
  }

  const user = verifyToken(token)
  
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid or expired token'
    })
  }

  return user
}

export function getAuthUser(event: H3Event): JWTPayload | null {
  const token = getCookie(event, 'auth-token')
  return token ? verifyToken(token) : null
}

export function setAuthCookie(event: H3Event, token: string) {
  setCookie(event, 'auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  })
}

export function clearAuthCookie(event: H3Event) {
  deleteCookie(event, 'auth-token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  })
}