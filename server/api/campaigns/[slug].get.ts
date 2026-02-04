/**
 * GET /api/campaigns/:slug
 * Get campaign details and associated people group data
 */
import { campaignService } from '#server/database/campaigns'
import { campaignSubscriptionService } from '#server/database/campaign-subscriptions'
import { peopleGroupService } from '#server/database/people-groups'
import { appConfigService } from '#server/database/app-config'
import { getFieldOptionLabel } from '../../utils/app/field-options'
import { generatePeopleGroupDescription } from '../../utils/app/people-group-description'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Campaign slug is required'
    })
  }

  // Get locale from query param or Accept-Language header
  const query = getQuery(event)
  const acceptLanguage = getHeader(event, 'accept-language')
  const locale = (query.locale as string) || acceptLanguage?.split(',')[0]?.split('-')[0] || 'en'

  const campaign = await campaignService.getCampaignBySlug(slug)

  if (!campaign) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Campaign not found'
    })
  }

  // Only return active campaigns to the public
  if (campaign.status !== 'active') {
    throw createError({
      statusCode: 404,
      statusMessage: 'Campaign not found'
    })
  }

  // Fetch associated people group if campaign has dt_id
  let peopleGroup = null
  if (campaign.dt_id) {
    const pg = await peopleGroupService.getPeopleGroupByDtId(campaign.dt_id)
    if (pg) {
      const metadata = pg.metadata ? JSON.parse(pg.metadata) : {}

      // Add labels for key_select fields (with locale support)
      const labels: Record<string, string | null> = {}

      if (metadata.imb_isoalpha3) {
        labels.imb_isoalpha3 = getFieldOptionLabel('imb_isoalpha3', metadata.imb_isoalpha3, locale)
      }
      if (metadata.imb_region) {
        labels.imb_region = getFieldOptionLabel('imb_region', metadata.imb_region, locale)
      }
      if (metadata.imb_subregion) {
        labels.imb_subregion = getFieldOptionLabel('imb_subregion', metadata.imb_subregion, locale)
      }
      if (metadata.imb_reg_of_language) {
        labels.imb_reg_of_language = getFieldOptionLabel('imb_reg_of_language', metadata.imb_reg_of_language, locale)
      }
      if (metadata.imb_reg_of_religion) {
        labels.imb_reg_of_religion = getFieldOptionLabel('imb_reg_of_religion', metadata.imb_reg_of_religion, locale)
      }
      if (metadata.imb_reg_of_religion_3) {
        labels.imb_reg_of_religion_3 = getFieldOptionLabel('imb_reg_of_religion_3', metadata.imb_reg_of_religion_3, locale)
      }
      if (metadata.imb_engagement_status) {
        labels.imb_engagement_status = getFieldOptionLabel('imb_engagement_status', metadata.imb_engagement_status, locale)
      }
      if (metadata.imb_evangelical_level !== undefined) {
        labels.imb_evangelical_level = getFieldOptionLabel('imb_evangelical_level', String(metadata.imb_evangelical_level), locale)
      }
      if (metadata.imb_congregation_existing !== undefined) {
        labels.imb_congregation_existing = getFieldOptionLabel('imb_congregation_existing', String(metadata.imb_congregation_existing), locale)
      }
      if (metadata.imb_church_planting !== undefined) {
        labels.imb_church_planting = getFieldOptionLabel('imb_church_planting', String(metadata.imb_church_planting), locale)
      }
      if (metadata.imb_gsec !== undefined) {
        labels.imb_gsec = getFieldOptionLabel('imb_gsec', String(metadata.imb_gsec), locale)
      }

      // Generate description from template
      const generatedDescription = generatePeopleGroupDescription({
        name: pg.name,
        people_desc: pg.people_desc,
        metadata
      })

      peopleGroup = {
        ...pg,
        metadata,
        labels,
        generatedDescription
      }
    }
  }

  // Get commitment stats
  const commitmentStats = await campaignSubscriptionService.getCommitmentStats(campaign.id)

  // Get global campaign start date
  const globalStartDate = await appConfigService.getConfig<string>('global_campaign_start_date')

  // Cache for 1 hour at edge (Cloudflare) - people_praying updates daily at 3 AM
  setResponseHeader(event, 'Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=600')

  return {
    campaign: {
      ...campaign,
      people_committed: commitmentStats.people_committed,
      committed_duration: commitmentStats.committed_duration
    },
    peopleGroup,
    globalStartDate
  }
})
