import { peopleGroupService } from '../../../database/people-groups'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = parseInt(getRouterParam(event, 'id') || '')

  if (isNaN(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid people group ID'
    })
  }

  const peopleGroup = await peopleGroupService.getPeopleGroupById(id)

  if (!peopleGroup) {
    throw createError({
      statusCode: 404,
      statusMessage: 'People group not found'
    })
  }

  return {
    peopleGroup: {
      ...peopleGroup,
      metadata: peopleGroup.metadata ? JSON.parse(peopleGroup.metadata) : {}
    }
  }
})
