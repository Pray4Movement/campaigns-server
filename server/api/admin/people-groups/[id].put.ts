import { peopleGroupService } from '../../../database/people-groups'
import { getIntParam } from '#server/utils/api-helpers'

interface UpdateBody {
  name?: string
  image_url?: string | null
  metadata?: Record<string, any>
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = getIntParam(event, 'id')

  const body = await readBody<UpdateBody>(event)

  // Build update data
  const updateData: {
    name?: string
    image_url?: string | null
    metadata?: string
  } = {}

  if (body.name !== undefined) {
    updateData.name = body.name
  }

  if (body.image_url !== undefined) {
    updateData.image_url = body.image_url
  }

  if (body.metadata !== undefined) {
    updateData.metadata = JSON.stringify(body.metadata)
  }

  const updated = await peopleGroupService.updatePeopleGroup(id, updateData)

  if (!updated) {
    throw createError({
      statusCode: 404,
      statusMessage: 'People group not found'
    })
  }

  return {
    peopleGroup: {
      ...updated,
      metadata: updated.metadata ? JSON.parse(updated.metadata) : {}
    }
  }
})
