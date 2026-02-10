import { apiKeyService } from '#server/database/api-keys'

export default defineEventHandler(async (event) => {
  const user = await requireAdmin(event)
  const keys = await apiKeyService.getUserApiKeys(user.userId)
  return { keys }
})
