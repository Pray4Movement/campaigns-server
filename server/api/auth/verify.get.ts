import { userService } from '../../database/users'
import { sendWelcomeEmail } from '../../utils/email'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const token = query.token as string
    
    // Validate token parameter
    if (!token || typeof token !== 'string') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Verification token is required'
      })
    }
    
    // Sanitize token (trim and limit length for security)
    const sanitizedToken = token.trim()
    if (sanitizedToken.length < 10 || sanitizedToken.length > 200) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid token format'
      })
    }
    
    // Find user by token_key
    const user = userService.getUserByTokenKey(sanitizedToken)
    
    if (!user) {
      // Redirect to login with error message
      return sendRedirect(event, '/login?error=invalid_token', 302)
    }
    
    if (user.verified) {
      // Already verified, redirect to login with info message
      return sendRedirect(event, '/login?info=already_verified', 302)
    }
    
    // Mark user as verified and generate new token key for security
    const success = userService.verifyUser(user.id)
    
    if (!success) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to verify user'
      })
    }
    
    // Generate new token key to invalidate the old one (security best practice)
    userService.updateTokenKey(user.id)
    
    // Send welcome email (fire and forget - don't block the response)
    sendWelcomeEmail(user.email, user.display_name || user.email.split('@')[0])
      .catch(error => console.error('Failed to send welcome email:', error))
    
    // Redirect to login with success message
    return sendRedirect(event, '/login?verified=true', 302)
    
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Email verification error:', error)
    
    // Redirect to login with generic error
    return sendRedirect(event, '/login?error=verification_failed', 302)
  }
})