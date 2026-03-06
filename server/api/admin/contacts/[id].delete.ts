import { contactService } from '../../../database/contacts'
import { getIntParam } from '#server/utils/api-helpers'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = getIntParam(event, 'id')
  const deleted = await contactService.delete(id)

  if (!deleted) {
    throw createError({ statusCode: 404, statusMessage: 'Contact not found' })
  }

  return { success: true }
})
