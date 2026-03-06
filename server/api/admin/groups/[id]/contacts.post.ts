import { connectionService } from '../../../../database/connections'
import { contactService } from '../../../../database/contacts'
import { groupService } from '../../../../database/groups'
import { getIntParam } from '#server/utils/api-helpers'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const groupId = getIntParam(event, 'id')
  const body = await readBody<{ contact_id: number }>(event)

  if (!body.contact_id) {
    throw createError({ statusCode: 400, statusMessage: 'contact_id is required' })
  }

  const [group, contact] = await Promise.all([
    groupService.getById(groupId),
    contactService.getById(body.contact_id)
  ])

  if (!group) throw createError({ statusCode: 404, statusMessage: 'Group not found' })
  if (!contact) throw createError({ statusCode: 404, statusMessage: 'Contact not found' })

  try {
    const connection = await connectionService.create({
      from_type: 'contact',
      from_id: body.contact_id,
      to_type: 'group',
      to_id: groupId
    })
    return { connection }
  } catch (error: any) {
    if (error.code === '23505') {
      throw createError({ statusCode: 409, statusMessage: 'Contact is already linked to this group' })
    }
    throw error
  }
})
