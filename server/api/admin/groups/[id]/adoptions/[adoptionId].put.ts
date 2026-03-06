import { peopleGroupAdoptionService } from '../../../../../database/people-group-adoptions'
import { getIntParam } from '#server/utils/api-helpers'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const adoptionId = getIntParam(event, 'adoptionId')
  const body = await readBody<{
    status?: 'pending' | 'active' | 'inactive'
    show_publicly?: boolean
  }>(event)

  const updated = await peopleGroupAdoptionService.update(adoptionId, {
    status: body.status,
    show_publicly: body.show_publicly
  })

  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: 'Adoption not found' })
  }

  return { adoption: updated }
})
