import { contactService } from '../../../database/contacts'
import { connectionService } from '../../../database/connections'
import { getIntParam } from '#server/utils/api-helpers'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = getIntParam(event, 'id')
  const contact = await contactService.getById(id)

  if (!contact) {
    throw createError({ statusCode: 404, statusMessage: 'Contact not found' })
  }

  const groups = await connectionService.getGroupsForContact(id)

  return { contact, groups }
})
