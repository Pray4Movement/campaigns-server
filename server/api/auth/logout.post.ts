import { clearAuthCookie } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  // Clear the auth cookie using the secure utility
  clearAuthCookie(event)

  return {
    success: true,
    message: 'Logged out successfully'
  }
})