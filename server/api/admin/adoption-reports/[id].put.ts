import { adoptionReportService } from '../../../database/adoption-reports'
import { getIntParam } from '#server/utils/api-helpers'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = getIntParam(event, 'id')
  const body = await readBody<{
    status: 'submitted' | 'approved' | 'rejected'
  }>(event)

  if (!body.status) {
    throw createError({ statusCode: 400, statusMessage: 'status is required' })
  }

  const updated = await adoptionReportService.updateStatus(id, body.status)

  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: 'Report not found' })
  }

  return { report: updated }
})
