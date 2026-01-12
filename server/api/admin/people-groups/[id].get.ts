import { peopleGroupService } from '../../../database/people-groups'
import { getIntParam } from '#server/utils/api-helpers'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = getIntParam(event, 'id')

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
