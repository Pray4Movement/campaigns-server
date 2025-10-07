import { userService } from '../../database/users'
import { generateToken, setAuthCookie } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { email, password } = body

    // Validate input
    if (!email || !password) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email and password are required'
      })
    }

    // Verify credentials
    const user = await userService.verifyPassword(email, password)

    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid email or password'
      })
    }

    // Enforce email verification
    if (!user.verified) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Please verify your email before logging in. Check your inbox for the verification email.'
      })
    }

    // Generate secure JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      display_name: user.display_name
    })

    // Set secure HTTP-only cookie
    setAuthCookie(event, token)

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        verified: user.verified,
        superadmin: user.superadmin
      }
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Login error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})