import { contactService } from '../../../database/contacts'
import { getIntParam } from '#server/utils/api-helpers'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = getIntParam(event, 'id')
  const body = await readBody<{
    name?: string
    email_address?: string | null
    phone?: string | null
    role?: string | null
  }>(event)

  const updated = await contactService.update(id, {
    name: body.name?.trim(),
    email_address: body.email_address !== undefined ? (body.email_address?.trim() || null) : undefined,
    phone: body.phone !== undefined ? (body.phone?.trim() || null) : undefined,
    role: body.role !== undefined ? (body.role?.trim() || null) : undefined
  })

  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: 'Contact not found' })
  }

  return { contact: updated }
})
