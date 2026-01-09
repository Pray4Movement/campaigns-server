import { libraryService, type LibraryExportData } from '#server/database/libraries'
import { libraryContentService } from '#server/database/library-content'

const VALID_LANGUAGES = ['en', 'es', 'fr', 'pt', 'de', 'it', 'zh', 'ar', 'ru', 'hi']

interface ImportRequestBody {
  data: LibraryExportData
  name?: string
  campaign_id?: number
  library_key?: string
}

function validateExportData(data: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!data || typeof data !== 'object') {
    errors.push('Invalid data structure')
    return { valid: false, errors }
  }

  const obj = data as Record<string, unknown>

  // Check version
  if (!obj.version || typeof obj.version !== 'string') {
    errors.push('Missing or invalid version field')
  }

  // Check library metadata
  if (!obj.library || typeof obj.library !== 'object') {
    errors.push('Missing library metadata')
  } else {
    const lib = obj.library as Record<string, unknown>
    if (!lib.name || typeof lib.name !== 'string') {
      errors.push('Missing library name')
    }
  }

  // Check content array
  if (!Array.isArray(obj.content)) {
    errors.push('Missing or invalid content array')
  } else {
    // Validate a sample of content items
    for (let i = 0; i < Math.min(obj.content.length, 10); i++) {
      const item = obj.content[i] as Record<string, unknown>
      if (typeof item.day_number !== 'number') {
        errors.push(`Content item ${i}: invalid day_number`)
      }
      if (typeof item.language_code !== 'string') {
        errors.push(`Content item ${i}: invalid language_code`)
      }
    }
  }

  return { valid: errors.length === 0, errors }
}

export default defineEventHandler(async (event) => {
  // Require admin authentication
  await requireAdmin(event)

  const body = await readBody<ImportRequestBody>(event)

  if (!body.data) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing export data'
    })
  }

  // Validate export data structure
  const validation = validateExportData(body.data)
  if (!validation.valid) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid export file format',
      data: { errors: validation.errors }
    })
  }

  const exportData = body.data

  // If campaign_id is provided, library_key is required
  if (body.campaign_id && !body.library_key) {
    throw createError({
      statusCode: 400,
      statusMessage: 'library_key is required when importing to a campaign'
    })
  }

  // Validate language codes in content
  const invalidLanguages = new Set<string>()
  for (const item of exportData.content) {
    if (!VALID_LANGUAGES.includes(item.language_code)) {
      invalidLanguages.add(item.language_code)
    }
  }

  if (invalidLanguages.size > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: `Invalid language codes: ${Array.from(invalidLanguages).join(', ')}`
    })
  }

  // Determine library name (use override or from export, ensure unique)
  const baseName = body.name || exportData.library.name
  const uniqueName = await libraryService.generateUniqueName(baseName)

  // Create the library
  const library = await libraryService.createLibrary({
    name: uniqueName,
    description: exportData.library.description,
    repeating: exportData.library.repeating,
    campaign_id: body.campaign_id || null,
    library_key: body.library_key || exportData.library.library_key || null
  })

  // Bulk import content
  const importResult = await libraryContentService.bulkCreateContent(library.id, exportData.content)

  // Get final stats
  const stats = await libraryService.getLibraryStats(library.id)

  return {
    success: true,
    library: {
      ...library,
      stats
    },
    importStats: {
      contentItemsImported: importResult.inserted,
      contentItemsSkipped: importResult.skipped
    }
  }
})
