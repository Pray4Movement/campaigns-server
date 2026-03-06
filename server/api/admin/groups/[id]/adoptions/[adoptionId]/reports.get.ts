import { adoptionReportService } from '../../../../../../database/adoption-reports'
import { getIntParam } from '#server/utils/api-helpers'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const adoptionId = getIntParam(event, 'adoptionId')
  const reports = await adoptionReportService.getForAdoption(adoptionId)

  return { reports }
})
