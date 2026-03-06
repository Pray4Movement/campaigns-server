import { peopleGroupAdoptionService } from '../../../../../database/people-group-adoptions'
import { getIntParam } from '#server/utils/api-helpers'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const adoptionId = getIntParam(event, 'adoptionId')
  const deleted = await peopleGroupAdoptionService.delete(adoptionId)

  if (!deleted) {
    throw createError({ statusCode: 404, statusMessage: 'Adoption not found' })
  }

  return { success: true }
})
