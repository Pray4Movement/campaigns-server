import { contactService } from '../../../database/contacts'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const body = await readBody<{
    name: string
    email_address?: string | null
    phone?: string | null
  }>(event)

  if (!body.name?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Name is required' })
  }

  const contact = await contactService.create({
    name: body.name.trim(),
    email_address: body.email_address?.trim() || null,
    phone: body.phone?.trim() || null
  })

  return { contact }
})
