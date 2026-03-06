import { peopleGroupAdoptionService } from '../../../database/people-group-adoptions'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')

  if (!token) {
    throw createError({ statusCode: 400, statusMessage: 'Token is required' })
  }

  const adoption = await peopleGroupAdoptionService.getByToken(token)

  if (!adoption) {
    throw createError({ statusCode: 404, statusMessage: 'Adoption not found' })
  }

  return {
    adoption: {
      id: adoption.id,
      people_group_name: adoption.people_group_name,
      people_group_slug: adoption.people_group_slug,
      group_name: adoption.group_name,
      status: adoption.status,
      adopted_at: adoption.adopted_at
    }
  }
})
