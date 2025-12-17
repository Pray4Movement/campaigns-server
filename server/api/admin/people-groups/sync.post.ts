import { peopleGroupService } from '../../../database/people-groups'

interface DtPeopleGroup {
  dt_id: string
  name: string
  imb_picture_url?: string | null
  [key: string]: any
}

interface ApiResponse {
  posts: DtPeopleGroup[]
}

export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event)

    const config = useRuntimeConfig()
    const apiUrl = config.dtPeopleGroupsApiUrl


    if (!apiUrl) {
      throw createError({
        statusCode: 500,
        statusMessage: 'DT_PEOPLE_GROUPS_API_URL is not configured'
      })
    }

    console.log('Syncing people groups from:', apiUrl)

    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw createError({
        statusCode: 502,
        statusMessage: `Failed to fetch from D.T. API: ${response.status}`
      })
    }

    const data: ApiResponse = await response.json()

    if (!data.posts || !Array.isArray(data.posts)) {
      throw createError({
        statusCode: 502,
        statusMessage: 'Invalid response format from D.T. API'
      })
    }

    let created = 0
    let updated = 0
    let errors = 0

    for (const group of data.posts) {
      if (!group.dt_id || !group.name) {
        errors++
        continue
      }

      // Extract core fields, put rest in metadata
      const { dt_id, name, imb_picture_url, ...rest } = group
      const imageUrl = imb_picture_url || null
      const metadata = JSON.stringify(rest)

      try {
        const existing = await peopleGroupService.getPeopleGroupByDtId(dt_id)

        if (existing) {
          await peopleGroupService.updatePeopleGroup(existing.id, {
            name,
            image_url: imageUrl,
            metadata
          })
          updated++
        } else {
          await peopleGroupService.createPeopleGroup({
            dt_id,
            name,
            image_url: imageUrl,
            metadata
          })
          created++
        }
      } catch (err) {
        console.error(`Error processing people group ${dt_id}:`, err)
        errors++
      }
    }

    return {
      success: true,
      message: `Sync completed: ${created} created, ${updated} updated, ${errors} errors`,
      stats: {
        total: data.posts.length,
        created,
        updated,
        errors
      }
    }
  } catch (error: any) {
    console.error('People groups sync error:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to sync people groups'
    })
  }
})
