import { libraryService, type LibraryExportData } from '#server/database/libraries'
import { libraryContentService } from '#server/database/library-content'
import { peopleGroupService } from '#server/database/people-groups'
import { getDatabase } from '#server/database/db'
import { sanitizeImportContent } from '#server/utils/sanitize-tiptap'

const VALID_LANGUAGES = ['en', 'es', 'fr', 'pt', 'de', 'it', 'zh', 'ar', 'ru', 'hi']

interface ImportRequestBody {
  data: LibraryExportData
  name?: string
  people_group_id?: number
  library_key?: string
  target_library_id?: number  // Import into existing library
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
  const body = await readBody<ImportRequestBody>(event)

  if (!body.data) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing export data'
    })
  }

  // Determine if this is a people group import or global import
  let user
  let targetPeopleGroupId: number | null = null

  if (body.target_library_id) {
    const existingLibrary = await libraryService.getLibraryById(body.target_library_id)
    if (existingLibrary?.people_group_id) {
      targetPeopleGroupId = existingLibrary.people_group_id
    }
  } else if (body.people_group_id) {
    targetPeopleGroupId = body.people_group_id
  }

  if (targetPeopleGroupId) {
    user = await requirePermission(event, 'content.edit')
    const hasAccess = await peopleGroupService.userCanAccessPeopleGroup(user.userId, targetPeopleGroupId)
    if (!hasAccess) {
      throw createError({
        statusCode: 403,
        statusMessage: 'You do not have access to this people group'
      })
    }
  } else {
    // Global library import - require admin
    await requireAdmin(event)
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

  // Sanitize content before import
  const sanitizedContent = sanitizeImportContent(exportData.content)

  // Use a transaction to ensure atomicity of the import operation
  const db = getDatabase()

  const result = await db.transaction(async (tx) => {
    let library
    let contentDeleted = 0

    if (body.target_library_id) {
      // Import into existing library - delete existing content first
      library = await libraryService.getLibraryById(body.target_library_id, tx)

      if (!library) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Target library not found'
        })
      }

      // Delete existing content
      contentDeleted = await libraryContentService.deleteAllLibraryContent(library.id, tx)
    } else {
      // Create new library
      const baseName = body.name || exportData.library.name
      const uniqueName = await libraryService.generateUniqueName(baseName)

      // Use library_key from body if provided, otherwise from export file
      const libraryKey = body.library_key || exportData.library.library_key || null

      library = await libraryService.createLibrary({
        name: uniqueName,
        description: exportData.library.description,
        repeating: exportData.library.repeating,
        people_group_id: body.people_group_id || null,
        library_key: libraryKey
      }, tx)
    }

    // Bulk import content
    const importResult = await libraryContentService.bulkCreateContent(library.id, sanitizedContent, tx)

    // Get final stats
    const stats = await libraryService.getLibraryStats(library.id, tx)

    return {
      library,
      stats,
      contentDeleted,
      importResult
    }
  })

  return {
    success: true,
    library: {
      ...result.library,
      stats: result.stats
    },
    importStats: {
      contentItemsImported: result.importResult.inserted,
      contentItemsSkipped: result.importResult.skipped,
      contentItemsDeleted: result.contentDeleted
    }
  }
})
