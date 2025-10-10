import { userService } from '#server/database/users'
import { sendVerificationEmail } from '#server/utils/email'
import { getUserWithRoles } from '#server/utils/auth'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { email, password, display_name } = body

    // Validate input
    if (!email || !password) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email and password are required'
      })
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid email format'
      })
    }

    // Password validation
    if (password.length < 6) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Password must be at least 6 characters long'
      })
    }

    // Create user (starts as unverified)
    const user = await userService.createUser({ 
      email, 
      password,
      display_name: display_name || email.split('@')[0]
    })

    // Generate verification URL using the user's token_key
    const config = useRuntimeConfig()
    const verificationUrl = `${config.public.siteUrl}/api/auth/verify?token=${user.token_key}`
    
    // Send verification email (fire and forget - don't block registration)
    sendVerificationEmail(user.email, user.display_name, verificationUrl)
      .catch(error => console.error('Failed to send verification email:', error))

    // Get user with roles
    const userWithRoles = await getUserWithRoles(user.id, user.email, user.display_name, user.verified)

    return {
      success: true,
      requiresVerification: true,
      message: 'Registration successful! Please check your email to verify your account before logging in.',
      user: userWithRoles
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    // Handle specific database errors
    if (error.message === 'User with this email already exists') {
      throw createError({
        statusCode: 409,
        statusMessage: error.message
      })
    }
    
    console.error('Registration error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})