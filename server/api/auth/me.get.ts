import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  // Use the secure JWT auth check
  const userPayload = requireAuth(event)

  return {
    user: {
      id: userPayload.userId,
      email: userPayload.email,
      display_name: userPayload.display_name
    }
  }
})