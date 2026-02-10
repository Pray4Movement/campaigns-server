import { apiKeyService } from '#server/database/api-keys'

export default defineEventHandler(async (event) => {
  const user = checkAuth(event)
  const keys = await apiKeyService.getUserApiKeys(user.userId)
  return { keys }
})
