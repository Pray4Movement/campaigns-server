import { connectionService } from '../../../../database/connections'
import { getIntParam } from '#server/utils/api-helpers'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const groupId = getIntParam(event, 'id')
  const query = getQuery(event)
  const contactId = parseInt(query.contact_id as string)

  if (!contactId) {
    throw createError({ statusCode: 400, statusMessage: 'contact_id is required' })
  }

  await connectionService.deleteByEntities('contact', contactId, 'group', groupId)
  return { success: true }
})
