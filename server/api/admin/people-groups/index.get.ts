import { peopleGroupService } from '../../../database/people-groups'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const query = getQuery(event)
  const search = query.search as string | undefined
  const limit = query.limit ? parseInt(query.limit as string) : undefined
  const offset = query.offset ? parseInt(query.offset as string) : undefined

  const [peopleGroups, total] = await Promise.all([
    peopleGroupService.getAllPeopleGroups({ search, limit, offset }),
    peopleGroupService.countPeopleGroups(search)
  ])

  // Parse metadata and descriptions for each group
  const groupsWithParsedMetadata = peopleGroups.map(group => ({
    ...group,
    metadata: group.metadata ? JSON.parse(group.metadata) : {},
    descriptions: group.descriptions ? (typeof group.descriptions === 'string' ? JSON.parse(group.descriptions) : group.descriptions) : {}
  }))

  return {
    peopleGroups: groupsWithParsedMetadata,
    total
  }
})
