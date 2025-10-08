import { userService } from '#server/database/users'
import { generateToken, setAuthCookie } from '#server/utils/auth'

interface GoogleTokenResponse {
  access_token: string
  expires_in: number
  token_type: string
  scope: string
  refresh_token?: string
}

interface GoogleUserInfo {
  id: string
  email: string
  verified_email: boolean
  name: string
  given_name: string
  family_name: string
  picture: string
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)

  const code = query.code as string
  const error = query.error as string

  if (error) {
    return sendRedirect(event, '/?error=google_auth_failed')
  }

  if (!code) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Authorization code not provided'
    })
  }

  try {
    // Exchange code for access token
    const tokenResponse = await $fetch<GoogleTokenResponse>('https://oauth2.googleapis.com/token', {
      method: 'POST',
      body: {
        code,
        client_id: config.googleClientId,
        client_secret: config.googleClientSecret,
        redirect_uri: config.googleRedirectUri,
        grant_type: 'authorization_code'
      }
    })

    // Get user info from Google
    const userInfo = await $fetch<GoogleUserInfo>('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenResponse.access_token}`
      }
    })

    if (!userInfo.email || !userInfo.verified_email) {
      return sendRedirect(event, '/?error=email_not_verified')
    }

    // Check if user exists
    let user = userService.getUserByEmail(userInfo.email)

    // If user doesn't exist, create them
    if (!user) {
      user = await userService.createUser({
        email: userInfo.email,
        password: crypto.randomUUID(), // Random password since they use OAuth
        display_name: userInfo.name || userInfo.email
      })

      // Auto-verify Google users
      userService.verifyUser(user.id)
      user = userService.getUserById(user.id)!
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      display_name: user.display_name
    })

    // Set auth cookie
    setAuthCookie(event, token)

    // Redirect to admin dashboard
    return sendRedirect(event, '/admin')
  } catch (err) {
    console.error('Google OAuth error:', err)
    return sendRedirect(event, '/?error=google_auth_failed')
  }
})
