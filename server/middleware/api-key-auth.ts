import { apiKeyService } from '#server/database/api-keys'
import { userService } from '#server/database/users'

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname

  // Only process API routes
  if (!path.startsWith('/api/')) return

  // Skip if browser session cookie is present
  const token = getCookie(event, 'auth-token')
  if (token) return

  // Check for API key in headers
  const authHeader = getHeader(event, 'authorization')
  const apiKeyHeader = getHeader(event, 'x-api-key')

  let rawKey: string | undefined

  if (authHeader?.startsWith('Bearer dxk_')) {
    rawKey = authHeader.substring(7) // strip "Bearer "
  } else if (apiKeyHeader?.startsWith('dxk_')) {
    rawKey = apiKeyHeader
  }

  if (!rawKey) return

  const prefix = rawKey.substring(0, 8)
  const candidates = await apiKeyService.findActiveKeysByPrefix(prefix)

  for (const candidate of candidates) {
    const match = apiKeyService.verifyKey(rawKey, candidate.key_hash)
    if (match) {
      const user = await userService.getUserById(candidate.user_id)
      if (user) {
        event.context.apiKeyAuth = {
          userId: user.id,
          email: user.email,
          display_name: user.display_name
        }

        apiKeyService.updateLastUsed(candidate.id).catch(e =>
          console.error('Failed to update API key last_used:', e)
        )
      }
      return
    }
  }
})
