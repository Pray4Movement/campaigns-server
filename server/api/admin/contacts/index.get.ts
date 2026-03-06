import { contactService } from '../../../database/contacts'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const query = getQuery(event)
  const search = query.search as string | undefined
  const limit = query.limit ? parseInt(query.limit as string) : undefined
  const offset = query.offset ? parseInt(query.offset as string) : undefined

  const [contacts, total] = await Promise.all([
    contactService.getAll({ search, limit, offset }),
    contactService.count(search)
  ])

  return { contacts, total }
})
